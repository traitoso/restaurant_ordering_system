import { getSupabase } from "../config/supabase.js";
import { Order } from "../models/Order.js";
import { handleSupabaseError } from "./handleSupabaseError.js";
import type { IOrderRepository, OrderFilters } from "./interfaces/IOrderRepository.js";

interface OrderItemRow {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number | string;
    created_at: string;
    products: { name: string } | null;
}

interface OrderRow {
    id: string;
    customer_name: string;
    table_number: number | null;
    status: string;
    notes: string | null;
    total: number | string;
    created_at: string;
    updated_at: string;
    order_items: OrderItemRow[];
}

const TABLE = "orders";
const ITEMS_TABLE = "order_items";
const SELECT_WITH_ITEMS = "*, order_items(id, product_id, quantity, unit_price, created_at, products(name))";

/** Implementação do repositório de pedidos (orders + order_items) utilizando Supabase. */
export class OrderRepository implements IOrderRepository {
    private toModel(row: OrderRow): Order {
        const items = [...row.order_items]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((item) => ({
                id: item.id,
                productId: item.product_id,
                productName: item.products?.name ?? null,
                quantity: item.quantity,
                unitPrice: Number(item.unit_price),
            }));

        return new Order({
            id: row.id,
            customerName: row.customer_name,
            tableNumber: row.table_number,
            notes: row.notes,
            status: row.status,
            items,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    private toRow(order: Order) {
        return {
            customer_name: order.getCustomerName(),
            table_number: order.getTableNumber(),
            notes: order.getNotes(),
            status: order.getStatus(),
            total: order.getTotal(),
        };
    }

    private itemRows(orderId: string, order: Order) {
        return order.getItems().map((item) => ({
            order_id: orderId,
            product_id: item.getProductId(),
            quantity: item.getQuantity(),
            unit_price: item.getUnitPrice(),
        }));
    }

    async findAll(filters: OrderFilters = {}): Promise<Order[]> {
        let query = getSupabase()
            .from(TABLE)
            .select(SELECT_WITH_ITEMS)
            .order("created_at", { ascending: false });

        if (filters.status) query = query.eq("status", filters.status);

        const { data, error } = await query;
        handleSupabaseError(error);
        return (data as unknown as OrderRow[]).map((row) => this.toModel(row));
    }

    async findById(id: string): Promise<Order | null> {
        const { data, error } = await getSupabase()
            .from(TABLE)
            .select(SELECT_WITH_ITEMS)
            .eq("id", id)
            .maybeSingle();
        handleSupabaseError(error);
        return data ? this.toModel(data as unknown as OrderRow) : null;
    }

    async countByProduct(productId: string): Promise<number> {
        const { count, error } = await getSupabase()
            .from(ITEMS_TABLE)
            .select("id", { count: "exact", head: true })
            .eq("product_id", productId);
        handleSupabaseError(error);
        return count ?? 0;
    }

    async create(order: Order): Promise<Order> {
        const supabase = getSupabase();

        const { data, error } = await supabase.from(TABLE).insert(this.toRow(order)).select("id").single();
        handleSupabaseError(error);
        const orderId = (data as { id: string }).id;

        const { error: itemsError } = await supabase.from(ITEMS_TABLE).insert(this.itemRows(orderId, order));
        if (itemsError) {
            // Desfaz o pedido criado para não deixar pedido sem itens.
            await supabase.from(TABLE).delete().eq("id", orderId);
            handleSupabaseError(itemsError);
        }

        return (await this.findById(orderId)) as Order;
    }

    async update(order: Order, options: { replaceItems?: boolean } = {}): Promise<Order> {
        const supabase = getSupabase();
        const orderId = order.getId() as string;

        const { error } = await supabase
            .from(TABLE)
            .update({ ...this.toRow(order), updated_at: new Date().toISOString() })
            .eq("id", orderId);
        handleSupabaseError(error);

        if (options.replaceItems) {
            const { error: deleteError } = await supabase.from(ITEMS_TABLE).delete().eq("order_id", orderId);
            handleSupabaseError(deleteError);

            const { error: insertError } = await supabase
                .from(ITEMS_TABLE)
                .insert(this.itemRows(orderId, order));
            handleSupabaseError(insertError);
        }

        return (await this.findById(orderId)) as Order;
    }

    async delete(id: string): Promise<void> {
        // Os itens são removidos automaticamente (ON DELETE CASCADE).
        const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
        handleSupabaseError(error);
    }
}

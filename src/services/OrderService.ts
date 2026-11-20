import { BusinessRuleError } from "../errors/BusinessRuleError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { isOrderStatus, Order, ORDER_STATUSES, type OrderStatus } from "../models/Order.js";
import type { OrderItemProps } from "../models/OrderItem.js";
import type { IOrderRepository } from "../repositories/interfaces/IOrderRepository.js";
import type { IProductRepository } from "../repositories/interfaces/IProductRepository.js";
import { assertHasFields, assertUUID } from "../utils/validators.js";

/**
 * Regras de negócio de pedidos:
 * - o pedido precisa de ao menos um item e do nome do cliente;
 * - só produtos existentes, ativos e disponíveis podem ser pedidos;
 * - o preço unitário é copiado do produto e o total é calculado pelo sistema;
 * - o status segue o fluxo pending → preparing → ready → delivered (ou cancelled);
 * - itens só podem ser alterados com o pedido pendente;
 * - só pedidos pendentes ou cancelados podem ser excluídos.
 */
export class OrderService {
    private readonly orderRepository: IOrderRepository;
    private readonly productRepository: IProductRepository;

    constructor(orderRepository: IOrderRepository, productRepository: IProductRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    async list(status?: unknown): Promise<Order[]> {
        if (status !== undefined && !isOrderStatus(status)) {
            throw new ValidationError(`status deve ser um dos valores: ${ORDER_STATUSES.join(", ")}.`);
        }
        return this.orderRepository.findAll({ status: status as OrderStatus | undefined });
    }

    async getById(id: unknown): Promise<Order> {
        const orderId = assertUUID(id);
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new NotFoundError("Pedido não encontrado.");
        }
        return order;
    }

    async create(input: Record<string, unknown>): Promise<Order> {
        if (input.status !== undefined && input.status !== "pending") {
            throw new BusinessRuleError('Todo pedido novo deve iniciar com o status "pending".');
        }

        const items = await this.resolveItems(input.items);
        const order = new Order({
            customerName: input.customer_name,
            tableNumber: input.table_number,
            notes: input.notes,
            items,
        });

        return this.orderRepository.create(order);
    }

    async update(id: unknown, input: unknown): Promise<Order> {
        const data = assertHasFields(input);
        const order = await this.getById(id);

        let replaceItems = false;
        if (data.items !== undefined) {
            const items = await this.resolveItems(data.items);
            order.replaceItems(items);
            replaceItems = true;
        }
        if (data.customer_name !== undefined) order.changeCustomerName(data.customer_name);
        if (data.table_number !== undefined) order.changeTableNumber(data.table_number);
        if (data.notes !== undefined) order.changeNotes(data.notes);
        if (data.status !== undefined) order.changeStatus(data.status);

        return this.orderRepository.update(order, { replaceItems });
    }

    async delete(id: unknown): Promise<void> {
        const order = await this.getById(id);
        if (!order.canBeDeleted()) {
            throw new BusinessRuleError(
                "Somente pedidos pendentes ou cancelados podem ser excluídos. Cancele o pedido antes."
            );
        }
        await this.orderRepository.delete(order.getId() as string);
    }

    /** Valida os itens recebidos e busca o preço atual de cada produto. */
    private async resolveItems(rawItems: unknown): Promise<OrderItemProps[]> {
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            throw new ValidationError("O pedido deve possuir ao menos um item.");
        }

        const items: OrderItemProps[] = [];
        for (const raw of rawItems as Array<Record<string, unknown>>) {
            if (typeof raw !== "object" || raw === null) {
                throw new ValidationError("Cada item deve ser um objeto com product_id e quantity.");
            }
            const productId = assertUUID(raw.product_id, "product_id");
            const product = await this.productRepository.findById(productId);

            if (!product) {
                throw new BusinessRuleError(`Produto ${productId} não encontrado.`);
            }
            if (!product.canBeOrdered()) {
                throw new BusinessRuleError(`O produto "${product.getName()}" não está disponível para pedidos.`);
            }

            items.push({
                productId,
                productName: product.getName(),
                quantity: raw.quantity,
                unitPrice: product.getPrice(),
            });
        }
        return items;
    }
}

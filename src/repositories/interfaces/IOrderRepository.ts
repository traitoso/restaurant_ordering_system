import type { Order, OrderStatus } from "../../models/Order.js";

export interface OrderFilters {
    status?: OrderStatus | undefined;
}

/** Contrato de acesso a dados de pedidos e seus itens. */
export interface IOrderRepository {
    findAll(filters?: OrderFilters): Promise<Order[]>;
    findById(id: string): Promise<Order | null>;
    countByProduct(productId: string): Promise<number>;
    create(order: Order): Promise<Order>;
    update(order: Order, options?: { replaceItems?: boolean }): Promise<Order>;
    delete(id: string): Promise<void>;
}

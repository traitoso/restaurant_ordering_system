import { beforeEach, describe, expect, it } from "vitest";
import { BusinessRuleError } from "../../src/errors/BusinessRuleError.js";
import { NotFoundError } from "../../src/errors/NotFoundError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Order } from "../../src/models/Order.js";
import { Product } from "../../src/models/Product.js";
import { OrderService } from "../../src/services/OrderService.js";
import {
    CATEGORY_ID,
    mockOrderRepository,
    mockProductRepository,
    ORDER_ID,
    PRODUCT_ID,
    PRODUCT_ID_2,
} from "./helpers/mockRepositories.js";

describe("OrderService", () => {
    let orderRepo: ReturnType<typeof mockOrderRepository>;
    let productRepo: ReturnType<typeof mockProductRepository>;
    let service: OrderService;

    const burger = new Product({ id: PRODUCT_ID, categoryId: CATEGORY_ID, name: "X-Burger", price: 29.9 });
    const soda = new Product({ id: PRODUCT_ID_2, categoryId: CATEGORY_ID, name: "Refrigerante", price: 7.5 });

    const existingOrder = (status = "pending") =>
        new Order({
            id: ORDER_ID,
            customerName: "Maria",
            status,
            items: [{ productId: PRODUCT_ID, productName: "X-Burger", quantity: 1, unitPrice: 29.9 }],
        });

    beforeEach(() => {
        orderRepo = mockOrderRepository();
        productRepo = mockProductRepository();
        productRepo.findById.mockImplementation(async (id: string) =>
            id === PRODUCT_ID ? burger : id === PRODUCT_ID_2 ? soda : null
        );
        service = new OrderService(orderRepo, productRepo);
    });

    describe("list e getById", () => {
        it("lista pedidos filtrando por status", async () => {
            orderRepo.findAll.mockResolvedValue([]);
            await service.list("pending");
            expect(orderRepo.findAll).toHaveBeenCalledWith({ status: "pending" });
        });

        it("rejeita status de filtro inválido", async () => {
            await expect(service.list("aberto")).rejects.toBeInstanceOf(ValidationError);
        });

        it("lança 404 para pedido inexistente", async () => {
            orderRepo.findById.mockResolvedValue(null);
            await expect(service.getById(ORDER_ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        it("cria pedido usando o preço atual dos produtos e calcula o total", async () => {
            const order = await service.create({
                customer_name: "Maria",
                table_number: 4,
                items: [
                    { product_id: PRODUCT_ID, quantity: 2 },
                    { product_id: PRODUCT_ID_2, quantity: 1 },
                ],
            });

            expect(order.getTotal()).toBe(67.3);
            expect(order.getStatus()).toBe("pending");
            expect(order.getItems()[0]?.getUnitPrice()).toBe(29.9);
            expect(orderRepo.create).toHaveBeenCalledOnce();
        });

        it("exige ao menos um item", async () => {
            await expect(service.create({ customer_name: "Maria", items: [] })).rejects.toBeInstanceOf(ValidationError);
            await expect(service.create({ customer_name: "Maria" })).rejects.toBeInstanceOf(ValidationError);
        });

        it("rejeita item malformado", async () => {
            await expect(service.create({ customer_name: "Maria", items: [null] })).rejects.toBeInstanceOf(
                ValidationError
            );
            await expect(
                service.create({ customer_name: "Maria", items: [{ product_id: "x", quantity: 1 }] })
            ).rejects.toBeInstanceOf(ValidationError);
        });

        it("não permite produto inexistente", async () => {
            await expect(
                service.create({
                    customer_name: "Maria",
                    items: [{ product_id: "66666666-6666-4666-8666-666666666666", quantity: 1 }],
                })
            ).rejects.toBeInstanceOf(BusinessRuleError);
        });

        it("não permite produto indisponível", async () => {
            const unavailable = new Product({
                id: PRODUCT_ID,
                categoryId: CATEGORY_ID,
                name: "X-Burger",
                price: 29.9,
                available: false,
            });
            productRepo.findById.mockResolvedValue(unavailable);
            await expect(
                service.create({ customer_name: "Maria", items: [{ product_id: PRODUCT_ID, quantity: 1 }] })
            ).rejects.toThrow('O produto "X-Burger" não está disponível para pedidos.');
            expect(orderRepo.create).not.toHaveBeenCalled();
        });

        it("não permite criar pedido com status diferente de pending", async () => {
            await expect(
                service.create({
                    customer_name: "Maria",
                    status: "delivered",
                    items: [{ product_id: PRODUCT_ID, quantity: 1 }],
                })
            ).rejects.toBeInstanceOf(BusinessRuleError);
        });
    });

    describe("update", () => {
        it("avança o status do pedido", async () => {
            orderRepo.findById.mockResolvedValue(existingOrder());
            const order = await service.update(ORDER_ID, { status: "preparing" });
            expect(order.getStatus()).toBe("preparing");
            expect(orderRepo.update).toHaveBeenCalledWith(expect.any(Order), { replaceItems: false });
        });

        it("substitui os itens de pedido pendente e recalcula o total", async () => {
            orderRepo.findById.mockResolvedValue(existingOrder());
            const order = await service.update(ORDER_ID, {
                customer_name: "Maria Souza",
                table_number: 8,
                notes: "Sem gelo",
                items: [{ product_id: PRODUCT_ID_2, quantity: 2 }],
            });
            expect(order.getTotal()).toBe(15);
            expect(order.getCustomerName()).toBe("Maria Souza");
            expect(orderRepo.update).toHaveBeenCalledWith(expect.any(Order), { replaceItems: true });
        });

        it("bloqueia salto de status inválido", async () => {
            orderRepo.findById.mockResolvedValue(existingOrder());
            await expect(service.update(ORDER_ID, { status: "delivered" })).rejects.toBeInstanceOf(BusinessRuleError);
            expect(orderRepo.update).not.toHaveBeenCalled();
        });

        it("bloqueia alteração de itens fora do status pending", async () => {
            orderRepo.findById.mockResolvedValue(existingOrder("preparing"));
            await expect(
                service.update(ORDER_ID, { items: [{ product_id: PRODUCT_ID, quantity: 3 }] })
            ).rejects.toBeInstanceOf(BusinessRuleError);
        });

        it("rejeita corpo vazio", async () => {
            await expect(service.update(ORDER_ID, {})).rejects.toBeInstanceOf(ValidationError);
        });
    });

    describe("delete", () => {
        it("remove pedido pendente", async () => {
            orderRepo.findById.mockResolvedValue(existingOrder());
            await service.delete(ORDER_ID);
            expect(orderRepo.delete).toHaveBeenCalledWith(ORDER_ID);
        });

        it("impede remover pedido em preparo ou entregue", async () => {
            orderRepo.findById.mockResolvedValue(existingOrder("preparing"));
            await expect(service.delete(ORDER_ID)).rejects.toBeInstanceOf(BusinessRuleError);
            expect(orderRepo.delete).not.toHaveBeenCalled();
        });
    });
});

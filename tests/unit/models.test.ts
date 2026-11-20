import { describe, expect, it } from "vitest";
import { BusinessRuleError } from "../../src/errors/BusinessRuleError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Category } from "../../src/models/Category.js";
import { Order } from "../../src/models/Order.js";
import { OrderItem } from "../../src/models/OrderItem.js";
import { Product } from "../../src/models/Product.js";
import { CATEGORY_ID, PRODUCT_ID, PRODUCT_ID_2 } from "./helpers/mockRepositories.js";

describe("Category (model)", () => {
    it("cria categoria válida aplicando valores padrão", () => {
        const category = new Category({ name: "  Lanches  " });
        expect(category.getName()).toBe("Lanches");
        expect(category.getDisplayOrder()).toBe(0);
        expect(category.isActive()).toBe(true);
        expect(category.getDescription()).toBeNull();
    });

    it("rejeita nome vazio ou muito longo", () => {
        expect(() => new Category({ name: "" })).toThrow(ValidationError);
        expect(() => new Category({ name: 123 })).toThrow("O nome da categoria é obrigatório.");
        expect(() => new Category({ name: "a".repeat(81) })).toThrow(ValidationError);
    });

    it("rejeita display_order negativo ou não inteiro", () => {
        expect(() => new Category({ name: "Bebidas", displayOrder: -1 })).toThrow(ValidationError);
        expect(() => new Category({ name: "Bebidas", displayOrder: 1.5 })).toThrow(ValidationError);
    });

    it("valida descrição, ícone e active", () => {
        const category = new Category({ name: "Bebidas", description: "Sucos", icon: "🥤" });
        expect(() => category.changeDescription(10)).toThrow(ValidationError);
        expect(() => category.changeDescription("x".repeat(256))).toThrow(ValidationError);
        expect(() => category.changeIcon(10)).toThrow(ValidationError);
        expect(() => category.setActive("sim")).toThrow(ValidationError);

        category.changeIcon(null);
        expect(category.getIcon()).toBeNull();
    });

    it("ativa, desativa e serializa em JSON", () => {
        const category = new Category({ id: CATEGORY_ID, name: "Bebidas", displayOrder: 2 });
        category.deactivate();
        expect(category.isActive()).toBe(false);
        category.activate();
        expect(category.toJSON()).toMatchObject({ id: CATEGORY_ID, name: "Bebidas", display_order: 2, active: true });
    });
});

describe("Product (model)", () => {
    const valid = { categoryId: CATEGORY_ID, name: "X-Burger", price: 29.9 };

    it("cria produto válido e disponível para pedidos", () => {
        const product = new Product(valid);
        expect(product.getPrice()).toBe(29.9);
        expect(product.canBeOrdered()).toBe(true);
        expect(product.toJSON()).toMatchObject({ category_id: CATEGORY_ID, name: "X-Burger", price: 29.9 });
    });

    it("não permite preço zero, negativo, não numérico ou com mais de 2 casas", () => {
        expect(() => new Product({ ...valid, price: 0 })).toThrow("O preço do produto deve ser maior que zero.");
        expect(() => new Product({ ...valid, price: -5 })).toThrow(ValidationError);
        expect(() => new Product({ ...valid, price: "10" })).toThrow("O preço do produto deve ser um número.");
        expect(() => new Product({ ...valid, price: 10.123 })).toThrow(ValidationError);
        expect(() => new Product({ ...valid, price: 100000 })).toThrow(ValidationError);
    });

    it("exige category_id em formato UUID e nome", () => {
        expect(() => new Product({ ...valid, categoryId: "abc" })).toThrow("category_id deve ser um UUID válido.");
        expect(() => new Product({ ...valid, name: " " })).toThrow(ValidationError);
        expect(() => new Product({ ...valid, name: "a".repeat(121) })).toThrow(ValidationError);
    });

    it("valida image_url, descrição e flags booleanas", () => {
        expect(() => new Product({ ...valid, imageUrl: "imagem.png" })).toThrow(ValidationError);
        expect(() => new Product({ ...valid, description: 5 })).toThrow(ValidationError);
        expect(() => new Product({ ...valid, available: "sim" })).toThrow(ValidationError);
        expect(() => new Product({ ...valid, active: 1 })).toThrow(ValidationError);

        const product = new Product({ ...valid, imageUrl: "https://img.com/x.png", description: "Bom" });
        expect(product.getImageUrl()).toBe("https://img.com/x.png");
        product.changeImageUrl(null);
        product.changeDescription(null);
        expect(product.getImageUrl()).toBeNull();
        expect(product.getDescription()).toBeNull();
    });

    it("produto inativo ou indisponível não pode ser pedido", () => {
        expect(new Product({ ...valid, available: false }).canBeOrdered()).toBe(false);
        expect(new Product({ ...valid, active: false }).canBeOrdered()).toBe(false);
    });
});

describe("OrderItem (model)", () => {
    it("calcula o subtotal com arredondamento", () => {
        const item = new OrderItem({ productId: PRODUCT_ID, quantity: 3, unitPrice: 10.1 });
        expect(item.getSubtotal()).toBe(30.3);
    });

    it("valida quantidade, produto e preço unitário", () => {
        expect(() => new OrderItem({ productId: PRODUCT_ID, quantity: 0, unitPrice: 10 })).toThrow(ValidationError);
        expect(() => new OrderItem({ productId: PRODUCT_ID, quantity: 51, unitPrice: 10 })).toThrow(ValidationError);
        expect(() => new OrderItem({ productId: "x", quantity: 1, unitPrice: 10 })).toThrow(ValidationError);
        expect(() => new OrderItem({ productId: PRODUCT_ID, quantity: 1, unitPrice: 0 })).toThrow(ValidationError);
    });
});

describe("Order (model)", () => {
    const items = [
        { productId: PRODUCT_ID, quantity: 2, unitPrice: 29.9 },
        { productId: PRODUCT_ID_2, quantity: 1, unitPrice: 8.5 },
    ];

    it("calcula o total a partir dos itens e inicia como pending", () => {
        const order = new Order({ customerName: "Maria", tableNumber: 5, items });
        expect(order.getStatus()).toBe("pending");
        expect(order.getTotal()).toBe(68.3);
        expect(order.toJSON().items).toHaveLength(2);
    });

    it("soma as quantidades quando o mesmo produto aparece duas vezes", () => {
        const order = new Order({
            customerName: "João",
            items: [
                { productId: PRODUCT_ID, quantity: 1, unitPrice: 10 },
                { productId: PRODUCT_ID, quantity: 2, unitPrice: 10 },
            ],
        });
        expect(order.getItems()).toHaveLength(1);
        expect(order.getItems()[0]?.getQuantity()).toBe(3);
        expect(order.getTotal()).toBe(30);
    });

    it("exige ao menos um item, nome do cliente e mesa válida", () => {
        expect(() => new Order({ customerName: "Ana", items: [] })).toThrow("O pedido deve possuir ao menos um item.");
        expect(() => new Order({ customerName: "", items })).toThrow(ValidationError);
        expect(() => new Order({ customerName: "a".repeat(101), items })).toThrow(ValidationError);
        expect(() => new Order({ customerName: "Ana", tableNumber: 0, items })).toThrow(ValidationError);
        expect(() => new Order({ customerName: "Ana", notes: 1, items })).toThrow(ValidationError);
        expect(() => new Order({ customerName: "Ana", notes: "x".repeat(256), items })).toThrow(ValidationError);
        expect(() => new Order({ customerName: "Ana", status: "aberto", items })).toThrow(ValidationError);
    });

    it("segue o fluxo de status permitido", () => {
        const order = new Order({ customerName: "Ana", items });
        order.changeStatus("preparing");
        order.changeStatus("ready");
        order.changeStatus("ready"); // mesmo status: sem efeito
        order.changeStatus("delivered");
        expect(order.getStatus()).toBe("delivered");
        expect(order.isFinalized()).toBe(true);
    });

    it("bloqueia transições de status inválidas", () => {
        const order = new Order({ customerName: "Ana", items });
        expect(() => order.changeStatus("delivered")).toThrow(BusinessRuleError);
        expect(() => order.changeStatus("xpto")).toThrow(ValidationError);

        order.changeStatus("cancelled");
        expect(() => order.changeStatus("pending")).toThrow(BusinessRuleError);
    });

    it("só permite alterar itens com o pedido pendente", () => {
        const order = new Order({ customerName: "Ana", items });
        order.replaceItems([{ productId: PRODUCT_ID, quantity: 1, unitPrice: 29.9 }]);
        expect(order.getTotal()).toBe(29.9);

        order.changeStatus("preparing");
        expect(() => order.replaceItems(items)).toThrow(BusinessRuleError);
    });

    it("não permite alterar dados de pedido finalizado", () => {
        const order = new Order({ customerName: "Ana", status: "delivered", items });
        expect(() => order.changeCustomerName("Bia")).toThrow(BusinessRuleError);
        expect(() => order.changeTableNumber(2)).toThrow(BusinessRuleError);
        expect(() => order.changeNotes("x")).toThrow(BusinessRuleError);
    });

    it("permite excluir apenas pedidos pendentes ou cancelados", () => {
        expect(new Order({ customerName: "Ana", items }).canBeDeleted()).toBe(true);
        expect(new Order({ customerName: "Ana", status: "cancelled", items }).canBeDeleted()).toBe(true);
        expect(new Order({ customerName: "Ana", status: "preparing", items }).canBeDeleted()).toBe(false);
        expect(new Order({ customerName: "Ana", status: "delivered", items }).canBeDeleted()).toBe(false);
    });
});

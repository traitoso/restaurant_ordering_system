import { beforeEach, describe, expect, it } from "vitest";
import { BusinessRuleError } from "../../src/errors/BusinessRuleError.js";
import { ConflictError } from "../../src/errors/ConflictError.js";
import { NotFoundError } from "../../src/errors/NotFoundError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Category } from "../../src/models/Category.js";
import { Product } from "../../src/models/Product.js";
import { ProductService } from "../../src/services/ProductService.js";
import {
    CATEGORY_ID,
    mockCategoryRepository,
    mockOrderRepository,
    mockProductRepository,
    PRODUCT_ID,
} from "./helpers/mockRepositories.js";

const OTHER_CATEGORY_ID = "55555555-5555-4555-8555-555555555555";

describe("ProductService", () => {
    let productRepo: ReturnType<typeof mockProductRepository>;
    let categoryRepo: ReturnType<typeof mockCategoryRepository>;
    let orderRepo: ReturnType<typeof mockOrderRepository>;
    let service: ProductService;

    const activeCategory = (id = CATEGORY_ID) => new Category({ id, name: "Lanches" });
    const existing = () => new Product({ id: PRODUCT_ID, categoryId: CATEGORY_ID, name: "X-Burger", price: 29.9 });

    beforeEach(() => {
        productRepo = mockProductRepository();
        categoryRepo = mockCategoryRepository();
        orderRepo = mockOrderRepository();
        service = new ProductService(productRepo, categoryRepo, orderRepo);
    });

    describe("list e getById", () => {
        it("lista produtos com filtros", async () => {
            productRepo.findAll.mockResolvedValue([existing()]);
            await service.list({ categoryId: CATEGORY_ID, available: true });
            expect(productRepo.findAll).toHaveBeenCalledWith({ categoryId: CATEGORY_ID, available: true });
        });

        it("rejeita filtro category_id inválido", async () => {
            await expect(service.list({ categoryId: "abc" })).rejects.toBeInstanceOf(ValidationError);
        });

        it("retorna produto existente e lança 404 para inexistente", async () => {
            productRepo.findById.mockResolvedValueOnce(existing()).mockResolvedValueOnce(null);
            await expect(service.getById(PRODUCT_ID)).resolves.toBeInstanceOf(Product);
            await expect(service.getById(PRODUCT_ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        const input = { category_id: CATEGORY_ID, name: "X-Salada", price: 25 };

        it("cria produto em categoria ativa", async () => {
            categoryRepo.findById.mockResolvedValue(activeCategory());
            const product = await service.create(input);
            expect(product.getName()).toBe("X-Salada");
            expect(productRepo.create).toHaveBeenCalledOnce();
        });

        it("não permite preço negativo (validação antes de acessar o banco)", async () => {
            await expect(service.create({ ...input, price: -1 })).rejects.toBeInstanceOf(ValidationError);
            expect(categoryRepo.findById).not.toHaveBeenCalled();
        });

        it("não permite categoria inexistente", async () => {
            categoryRepo.findById.mockResolvedValue(null);
            await expect(service.create(input)).rejects.toThrow("A categoria informada não existe.");
        });

        it("não permite categoria inativa", async () => {
            const inactive = activeCategory();
            inactive.deactivate();
            categoryRepo.findById.mockResolvedValue(inactive);
            await expect(service.create(input)).rejects.toBeInstanceOf(BusinessRuleError);
            expect(productRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("atualiza preço, disponibilidade e demais campos", async () => {
            productRepo.findById.mockResolvedValue(existing());
            const updated = await service.update(PRODUCT_ID, {
                name: "X-Burger Duplo",
                description: "Dois hambúrgueres",
                price: 35.5,
                image_url: "https://img.com/x.png",
                available: false,
                active: true,
            });
            expect(updated.getPrice()).toBe(35.5);
            expect(updated.isAvailable()).toBe(false);
            expect(categoryRepo.findById).not.toHaveBeenCalled();
        });

        it("valida a nova categoria ao trocar de categoria", async () => {
            productRepo.findById.mockResolvedValue(existing());
            categoryRepo.findById.mockResolvedValue(activeCategory(OTHER_CATEGORY_ID));
            const updated = await service.update(PRODUCT_ID, { category_id: OTHER_CATEGORY_ID });
            expect(updated.getCategoryId()).toBe(OTHER_CATEGORY_ID);
            expect(categoryRepo.findById).toHaveBeenCalledWith(OTHER_CATEGORY_ID);
        });

        it("não permite mover para categoria inexistente", async () => {
            productRepo.findById.mockResolvedValue(existing());
            categoryRepo.findById.mockResolvedValue(null);
            await expect(service.update(PRODUCT_ID, { category_id: OTHER_CATEGORY_ID })).rejects.toBeInstanceOf(
                BusinessRuleError
            );
        });

        it("não permite atualizar com preço zero", async () => {
            productRepo.findById.mockResolvedValue(existing());
            await expect(service.update(PRODUCT_ID, { price: 0 })).rejects.toBeInstanceOf(ValidationError);
            expect(productRepo.update).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("remove produto que nunca foi pedido", async () => {
            productRepo.findById.mockResolvedValue(existing());
            orderRepo.countByProduct.mockResolvedValue(0);
            await service.delete(PRODUCT_ID);
            expect(productRepo.delete).toHaveBeenCalledWith(PRODUCT_ID);
        });

        it("impede remover produto utilizado em pedidos", async () => {
            productRepo.findById.mockResolvedValue(existing());
            orderRepo.countByProduct.mockResolvedValue(2);
            await expect(service.delete(PRODUCT_ID)).rejects.toBeInstanceOf(ConflictError);
            expect(productRepo.delete).not.toHaveBeenCalled();
        });
    });
});

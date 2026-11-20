import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "../../src/errors/ConflictError.js";
import { NotFoundError } from "../../src/errors/NotFoundError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Category } from "../../src/models/Category.js";
import { CategoryService } from "../../src/services/CategoryService.js";
import { CATEGORY_ID, mockCategoryRepository, mockProductRepository } from "./helpers/mockRepositories.js";

describe("CategoryService", () => {
    let categoryRepo: ReturnType<typeof mockCategoryRepository>;
    let productRepo: ReturnType<typeof mockProductRepository>;
    let service: CategoryService;

    const existing = () => new Category({ id: CATEGORY_ID, name: "Lanches", displayOrder: 1 });

    beforeEach(() => {
        categoryRepo = mockCategoryRepository();
        productRepo = mockProductRepository();
        service = new CategoryService(categoryRepo, productRepo);
    });

    describe("list", () => {
        it("repassa os filtros ao repositório", async () => {
            categoryRepo.findAll.mockResolvedValue([existing()]);
            const result = await service.list({ search: "lan", active: true });
            expect(result).toHaveLength(1);
            expect(categoryRepo.findAll).toHaveBeenCalledWith({ search: "lan", active: true });
        });
    });

    describe("getById", () => {
        it("retorna a categoria quando existe", async () => {
            categoryRepo.findById.mockResolvedValue(existing());
            const category = await service.getById(CATEGORY_ID);
            expect(category.getName()).toBe("Lanches");
        });

        it("lança NotFoundError quando não existe", async () => {
            categoryRepo.findById.mockResolvedValue(null);
            await expect(service.getById(CATEGORY_ID)).rejects.toBeInstanceOf(NotFoundError);
        });

        it("lança ValidationError para ID que não é UUID", async () => {
            await expect(service.getById("123")).rejects.toBeInstanceOf(ValidationError);
            expect(categoryRepo.findById).not.toHaveBeenCalled();
        });
    });

    describe("create", () => {
        it("cria categoria com nome inédito", async () => {
            categoryRepo.findByName.mockResolvedValue(null);
            const created = await service.create({ name: "Bebidas", display_order: 2 });
            expect(created.getName()).toBe("Bebidas");
            expect(categoryRepo.create).toHaveBeenCalledOnce();
        });

        it("impede nome duplicado", async () => {
            categoryRepo.findByName.mockResolvedValue(existing());
            await expect(service.create({ name: "lanches" })).rejects.toBeInstanceOf(ConflictError);
            expect(categoryRepo.create).not.toHaveBeenCalled();
        });

        it("não chama o repositório quando os dados são inválidos", async () => {
            await expect(service.create({ name: "", display_order: -1 })).rejects.toBeInstanceOf(ValidationError);
            expect(categoryRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("atualiza somente os campos enviados", async () => {
            categoryRepo.findById.mockResolvedValue(existing());
            categoryRepo.findByName.mockResolvedValue(null);

            const updated = await service.update(CATEGORY_ID, {
                name: "Lanches Artesanais",
                description: "Feitos na hora",
                icon: "🍔",
                display_order: 3,
                active: false,
            });

            expect(updated.getName()).toBe("Lanches Artesanais");
            expect(updated.getDisplayOrder()).toBe(3);
            expect(updated.isActive()).toBe(false);
            expect(categoryRepo.update).toHaveBeenCalledOnce();
        });

        it("permite manter o próprio nome", async () => {
            categoryRepo.findById.mockResolvedValue(existing());
            categoryRepo.findByName.mockResolvedValue(existing());
            await expect(service.update(CATEGORY_ID, { name: "Lanches" })).resolves.toBeDefined();
        });

        it("impede renomear para nome de outra categoria", async () => {
            categoryRepo.findById.mockResolvedValue(existing());
            categoryRepo.findByName.mockResolvedValue(
                new Category({ id: "99999999-9999-4999-8999-999999999999", name: "Bebidas" })
            );
            await expect(service.update(CATEGORY_ID, { name: "Bebidas" })).rejects.toBeInstanceOf(ConflictError);
        });

        it("rejeita corpo vazio", async () => {
            await expect(service.update(CATEGORY_ID, {})).rejects.toThrow("Nenhum campo informado para atualização.");
            await expect(service.update(CATEGORY_ID, null)).rejects.toBeInstanceOf(ValidationError);
        });
    });

    describe("delete", () => {
        it("remove categoria sem produtos", async () => {
            categoryRepo.findById.mockResolvedValue(existing());
            productRepo.countByCategory.mockResolvedValue(0);
            await service.delete(CATEGORY_ID);
            expect(categoryRepo.delete).toHaveBeenCalledWith(CATEGORY_ID);
        });

        it("impede remover categoria com produtos vinculados", async () => {
            categoryRepo.findById.mockResolvedValue(existing());
            productRepo.countByCategory.mockResolvedValue(3);
            await expect(service.delete(CATEGORY_ID)).rejects.toBeInstanceOf(ConflictError);
            expect(categoryRepo.delete).not.toHaveBeenCalled();
        });

        it("lança NotFoundError ao remover categoria inexistente", async () => {
            categoryRepo.findById.mockResolvedValue(null);
            await expect(service.delete(CATEGORY_ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });
});

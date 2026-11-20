import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Category } from "../models/Category.js";
import type { CategoryFilters, ICategoryRepository } from "../repositories/interfaces/ICategoryRepository.js";
import type { IProductRepository } from "../repositories/interfaces/IProductRepository.js";
import { assertHasFields, assertUUID } from "../utils/validators.js";

/**
 * Regras de negócio de categorias:
 * - nome obrigatório e único (sem diferenciar maiúsculas/minúsculas);
 * - display_order inteiro e não negativo;
 * - não é permitido excluir categoria que possua produtos vinculados.
 */
export class CategoryService {
    private readonly categoryRepository: ICategoryRepository;
    private readonly productRepository: IProductRepository;

    constructor(categoryRepository: ICategoryRepository, productRepository: IProductRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    async list(filters: CategoryFilters = {}): Promise<Category[]> {
        return this.categoryRepository.findAll(filters);
    }

    async getById(id: unknown): Promise<Category> {
        const categoryId = assertUUID(id);
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new NotFoundError("Categoria não encontrada.");
        }
        return category;
    }

    async create(input: Record<string, unknown>): Promise<Category> {
        const category = new Category({
            name: input.name,
            description: input.description,
            icon: input.icon,
            displayOrder: input.display_order,
            active: input.active,
        });

        await this.ensureUniqueName(category.getName());
        return this.categoryRepository.create(category);
    }

    async update(id: unknown, input: unknown): Promise<Category> {
        const data = assertHasFields(input);
        const category = await this.getById(id);

        if (data.name !== undefined) {
            category.rename(data.name);
            await this.ensureUniqueName(category.getName(), category.getId());
        }
        if (data.description !== undefined) category.changeDescription(data.description);
        if (data.icon !== undefined) category.changeIcon(data.icon);
        if (data.display_order !== undefined) category.changeDisplayOrder(data.display_order);
        if (data.active !== undefined) category.setActive(data.active);

        return this.categoryRepository.update(category);
    }

    async delete(id: unknown): Promise<void> {
        const category = await this.getById(id);
        const categoryId = category.getId() as string;

        const productCount = await this.productRepository.countByCategory(categoryId);
        if (productCount > 0) {
            throw new ConflictError(
                `Não é possível excluir a categoria: existem ${productCount} produto(s) vinculado(s).`
            );
        }

        await this.categoryRepository.delete(categoryId);
    }

    private async ensureUniqueName(name: string, currentId?: string): Promise<void> {
        const existing = await this.categoryRepository.findByName(name);
        if (existing && existing.getId() !== currentId) {
            throw new ConflictError(`Já existe uma categoria com o nome "${name}".`);
        }
    }
}

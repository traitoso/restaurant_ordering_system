import { BusinessRuleError } from "../errors/BusinessRuleError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { Product } from "../models/Product.js";
import type { ICategoryRepository } from "../repositories/interfaces/ICategoryRepository.js";
import type { IOrderRepository } from "../repositories/interfaces/IOrderRepository.js";
import type { IProductRepository, ProductFilters } from "../repositories/interfaces/IProductRepository.js";
import { assertHasFields, assertUUID } from "../utils/validators.js";

/**
 * Regras de negócio de produtos:
 * - preço maior que zero, com no máximo 2 casas decimais;
 * - o produto deve pertencer a uma categoria existente e ativa;
 * - produto que já aparece em pedidos não pode ser excluído (deve ser desativado).
 */
export class ProductService {
    private readonly productRepository: IProductRepository;
    private readonly categoryRepository: ICategoryRepository;
    private readonly orderRepository: IOrderRepository;

    constructor(
        productRepository: IProductRepository,
        categoryRepository: ICategoryRepository,
        orderRepository: IOrderRepository,
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
    }

    async list(filters: ProductFilters = {}): Promise<Product[]> {
        if (filters.categoryId !== undefined) {
            assertUUID(filters.categoryId, "category_id");
        }
        return this.productRepository.findAll(filters);
    }

    async getById(id: unknown): Promise<Product> {
        const productId = assertUUID(id);
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundError("Produto não encontrado.");
        }
        return product;
    }

    async create(input: Record<string, unknown>): Promise<Product> {
        const product = new Product({
            categoryId: input.category_id,
            name: input.name,
            description: input.description,
            price: input.price,
            imageUrl: input.image_url,
            available: input.available,
            active: input.active,
        });

        await this.ensureCategoryAcceptsProducts(product.getCategoryId());
        return this.productRepository.create(product);
    }

    async update(id: unknown, input: unknown): Promise<Product> {
        const data = assertHasFields(input);
        const product = await this.getById(id);

        if (data.category_id !== undefined && data.category_id !== product.getCategoryId()) {
            product.moveToCategory(data.category_id);
            await this.ensureCategoryAcceptsProducts(product.getCategoryId());
        }
        if (data.name !== undefined) product.rename(data.name);
        if (data.description !== undefined) product.changeDescription(data.description);
        if (data.price !== undefined) product.changePrice(data.price);
        if (data.image_url !== undefined) product.changeImageUrl(data.image_url);
        if (data.available !== undefined) product.setAvailable(data.available);
        if (data.active !== undefined) product.setActive(data.active);

        return this.productRepository.update(product);
    }

    async delete(id: unknown): Promise<void> {
        const product = await this.getById(id);
        const productId = product.getId() as string;

        const orderCount = await this.orderRepository.countByProduct(productId);
        if (orderCount > 0) {
            throw new ConflictError(
                "Não é possível excluir o produto: ele já foi utilizado em pedidos. Desative-o (active = false)."
            );
        }

        await this.productRepository.delete(productId);
    }

    private async ensureCategoryAcceptsProducts(categoryId: string): Promise<void> {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new BusinessRuleError("A categoria informada não existe.");
        }
        if (!category.isActive()) {
            throw new BusinessRuleError("Não é possível vincular produtos a uma categoria inativa.");
        }
    }
}

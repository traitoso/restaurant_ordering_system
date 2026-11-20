import type { Product } from "../../models/Product.js";

export interface ProductFilters {
    search?: string | undefined;
    categoryId?: string | undefined;
    available?: boolean | undefined;
    active?: boolean | undefined;
}

/** Contrato de acesso a dados de produtos. */
export interface IProductRepository {
    findAll(filters?: ProductFilters): Promise<Product[]>;
    findById(id: string): Promise<Product | null>;
    countByCategory(categoryId: string): Promise<number>;
    create(product: Product): Promise<Product>;
    update(product: Product): Promise<Product>;
    delete(id: string): Promise<void>;
}

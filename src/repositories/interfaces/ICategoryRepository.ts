import type { Category } from "../../models/Category.js";

export interface CategoryFilters {
    search?: string | undefined;
    active?: boolean | undefined;
}

/** Contrato de acesso a dados de categorias (permite trocar a implementação e usar mocks nos testes). */
export interface ICategoryRepository {
    findAll(filters?: CategoryFilters): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
    findByName(name: string): Promise<Category | null>;
    create(category: Category): Promise<Category>;
    update(category: Category): Promise<Category>;
    delete(id: string): Promise<void>;
}

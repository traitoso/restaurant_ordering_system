import { getSupabase } from "../config/supabase.js";
import { Product } from "../models/Product.js";
import { handleSupabaseError, sanitizeSearch } from "./handleSupabaseError.js";
import type { IProductRepository, ProductFilters } from "./interfaces/IProductRepository.js";

interface ProductRow {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number | string;
    image_url: string | null;
    available: boolean;
    active: boolean;
    created_at: string;
}

const TABLE = "products";

/** Implementação do repositório de produtos utilizando Supabase/PostgreSQL. */
export class ProductRepository implements IProductRepository {
    private toModel(row: ProductRow): Product {
        return new Product({
            id: row.id,
            categoryId: row.category_id,
            name: row.name,
            description: row.description,
            price: Number(row.price),
            imageUrl: row.image_url,
            available: row.available,
            active: row.active,
            createdAt: row.created_at,
        });
    }

    private toRow(product: Product) {
        return {
            category_id: product.getCategoryId(),
            name: product.getName(),
            description: product.getDescription(),
            price: product.getPrice(),
            image_url: product.getImageUrl(),
            available: product.isAvailable(),
            active: product.isActive(),
        };
    }

    async findAll(filters: ProductFilters = {}): Promise<Product[]> {
        let query = getSupabase().from(TABLE).select("*").order("name", { ascending: true });

        if (filters.search) {
            const term = sanitizeSearch(filters.search);
            query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
        }
        if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
        if (filters.available !== undefined) query = query.eq("available", filters.available);
        if (filters.active !== undefined) query = query.eq("active", filters.active);

        const { data, error } = await query;
        handleSupabaseError(error);
        return (data as ProductRow[]).map((row) => this.toModel(row));
    }

    async findById(id: string): Promise<Product | null> {
        const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
        handleSupabaseError(error);
        return data ? this.toModel(data as ProductRow) : null;
    }

    async countByCategory(categoryId: string): Promise<number> {
        const { count, error } = await getSupabase()
            .from(TABLE)
            .select("id", { count: "exact", head: true })
            .eq("category_id", categoryId);
        handleSupabaseError(error);
        return count ?? 0;
    }

    async create(product: Product): Promise<Product> {
        const { data, error } = await getSupabase()
            .from(TABLE)
            .insert(this.toRow(product))
            .select()
            .single();
        handleSupabaseError(error);
        return this.toModel(data as ProductRow);
    }

    async update(product: Product): Promise<Product> {
        const { data, error } = await getSupabase()
            .from(TABLE)
            .update(this.toRow(product))
            .eq("id", product.getId())
            .select()
            .single();
        handleSupabaseError(error);
        return this.toModel(data as ProductRow);
    }

    async delete(id: string): Promise<void> {
        const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
        handleSupabaseError(error);
    }
}

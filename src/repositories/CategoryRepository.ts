import { getSupabase } from "../config/supabase.js";
import { Category } from "../models/Category.js";
import { handleSupabaseError, sanitizeSearch } from "./handleSupabaseError.js";
import type { CategoryFilters, ICategoryRepository } from "./interfaces/ICategoryRepository.js";

interface CategoryRow {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    display_order: number;
    active: boolean;
    created_at: string;
}

const TABLE = "categories";

/** Implementação do repositório de categorias utilizando Supabase/PostgreSQL. */
export class CategoryRepository implements ICategoryRepository {
    private toModel(row: CategoryRow): Category {
        return new Category({
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            displayOrder: row.display_order,
            active: row.active,
            createdAt: row.created_at,
        });
    }

    private toRow(category: Category) {
        return {
            name: category.getName(),
            description: category.getDescription(),
            icon: category.getIcon(),
            display_order: category.getDisplayOrder(),
            active: category.isActive(),
        };
    }

    async findAll(filters: CategoryFilters = {}): Promise<Category[]> {
        let query = getSupabase()
            .from(TABLE)
            .select("*")
            .order("display_order", { ascending: true })
            .order("name", { ascending: true });

        if (filters.search) {
            const term = sanitizeSearch(filters.search);
            query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
        }
        if (filters.active !== undefined) {
            query = query.eq("active", filters.active);
        }

        const { data, error } = await query;
        handleSupabaseError(error);
        return (data as CategoryRow[]).map((row) => this.toModel(row));
    }

    async findById(id: string): Promise<Category | null> {
        const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
        handleSupabaseError(error);
        return data ? this.toModel(data as CategoryRow) : null;
    }

    async findByName(name: string): Promise<Category | null> {
        const { data, error } = await getSupabase()
            .from(TABLE)
            .select("*")
            .ilike("name", sanitizeSearch(name))
            .limit(1)
            .maybeSingle();
        handleSupabaseError(error);
        return data ? this.toModel(data as CategoryRow) : null;
    }

    async create(category: Category): Promise<Category> {
        const { data, error } = await getSupabase()
            .from(TABLE)
            .insert(this.toRow(category))
            .select()
            .single();
        handleSupabaseError(error);
        return this.toModel(data as CategoryRow);
    }

    async update(category: Category): Promise<Category> {
        const { data, error } = await getSupabase()
            .from(TABLE)
            .update(this.toRow(category))
            .eq("id", category.getId())
            .select()
            .single();
        handleSupabaseError(error);
        return this.toModel(data as CategoryRow);
    }

    async delete(id: string): Promise<void> {
        const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
        handleSupabaseError(error);
    }
}

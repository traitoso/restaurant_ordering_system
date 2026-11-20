import { ConflictError } from "../errors/ConflictError.js";
import { DatabaseError } from "../errors/DatabaseError.js";
import { ValidationError } from "../errors/ValidationError.js";

interface PostgrestLikeError {
    code?: string;
    message: string;
}

/**
 * Traduz erros do PostgreSQL/Supabase em erros da aplicação.
 * Códigos: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export function handleSupabaseError(error: PostgrestLikeError | null): void {
    if (!error) return;

    switch (error.code) {
        case "23505":
            throw new ConflictError("Já existe um registro com esses dados.");
        case "23503":
            throw new ConflictError("A operação viola um relacionamento entre registros.");
        case "23514":
        case "22P02":
            throw new ValidationError("Dados inválidos para o banco de dados.");
        default:
            console.error("Erro do Supabase:", error);
            throw new DatabaseError();
    }
}

/** Remove caracteres usados na sintaxe de filtros do PostgREST. */
export function sanitizeSearch(term: string): string {
    return term.replace(/[%,()*\\]/g, " ").trim();
}

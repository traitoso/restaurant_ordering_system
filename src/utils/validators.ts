import { ValidationError } from "../errors/ValidationError.js";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(value: unknown): value is string {
    return typeof value === "string" && UUID_REGEX.test(value);
}

export function assertUUID(value: unknown, field = "id"): string {
    if (!isUUID(value)) {
        throw new ValidationError(`${field} deve ser um UUID válido.`);
    }
    return value;
}

/** Converte "true"/"false" vindos da query string em boolean. */
export function parseBooleanQuery(value: unknown, field: string): boolean | undefined {
    if (value === undefined) return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new ValidationError(`${field} deve ser "true" ou "false".`);
}

/** Lê um texto opcional da query string. */
export function parseStringQuery(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

/** Garante que o corpo da atualização tenha ao menos um campo. */
export function assertHasFields(body: unknown): Record<string, unknown> {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new ValidationError("O corpo da requisição deve ser um objeto JSON.");
    }
    if (Object.keys(body).length === 0) {
        throw new ValidationError("Nenhum campo informado para atualização.");
    }
    return body as Record<string, unknown>;
}

export function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

import { describe, expect, it } from "vitest";
import { ConflictError } from "../../src/errors/ConflictError.js";
import { DatabaseError } from "../../src/errors/DatabaseError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { handleSupabaseError, sanitizeSearch } from "../../src/repositories/handleSupabaseError.js";
import {
    assertHasFields,
    assertUUID,
    isUUID,
    parseBooleanQuery,
    parseStringQuery,
    roundMoney,
} from "../../src/utils/validators.js";

describe("validators", () => {
    it("reconhece UUIDs válidos e inválidos", () => {
        expect(isUUID("11111111-1111-4111-8111-111111111111")).toBe(true);
        expect(isUUID("123")).toBe(false);
        expect(isUUID(undefined)).toBe(false);
        expect(() => assertUUID("abc", "product_id")).toThrow("product_id deve ser um UUID válido.");
    });

    it("converte booleanos da query string", () => {
        expect(parseBooleanQuery(undefined, "active")).toBeUndefined();
        expect(parseBooleanQuery("true", "active")).toBe(true);
        expect(parseBooleanQuery("false", "active")).toBe(false);
        expect(() => parseBooleanQuery("sim", "active")).toThrow(ValidationError);
    });

    it("lê textos da query string", () => {
        expect(parseStringQuery("  lanche ")).toBe("lanche");
        expect(parseStringQuery("   ")).toBeUndefined();
        expect(parseStringQuery(["a"])).toBeUndefined();
    });

    it("exige corpo com ao menos um campo", () => {
        expect(assertHasFields({ name: "x" })).toEqual({ name: "x" });
        expect(() => assertHasFields([])).toThrow(ValidationError);
        expect(() => assertHasFields({})).toThrow(ValidationError);
    });

    it("arredonda valores monetários", () => {
        expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    });
});

describe("handleSupabaseError", () => {
    it("não faz nada sem erro", () => {
        expect(() => handleSupabaseError(null)).not.toThrow();
    });

    it("traduz códigos do PostgreSQL em erros da aplicação", () => {
        expect(() => handleSupabaseError({ code: "23505", message: "dup" })).toThrow(ConflictError);
        expect(() => handleSupabaseError({ code: "23503", message: "fk" })).toThrow(ConflictError);
        expect(() => handleSupabaseError({ code: "23514", message: "check" })).toThrow(ValidationError);
        expect(() => handleSupabaseError({ code: "XX000", message: "boom" })).toThrow(DatabaseError);
    });

    it("remove caracteres especiais da busca", () => {
        expect(sanitizeSearch("x,(y)%")).toBe("x  y");
    });
});

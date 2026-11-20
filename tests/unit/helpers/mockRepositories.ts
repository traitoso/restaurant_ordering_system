import { vi } from "vitest";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository.js";
import type { IOrderRepository } from "../../../src/repositories/interfaces/IOrderRepository.js";
import type { IProductRepository } from "../../../src/repositories/interfaces/IProductRepository.js";

/** Repositórios falsos (mocks) para isolar os services do banco de dados. */
export function mockCategoryRepository() {
    return {
        findAll: vi.fn(),
        findById: vi.fn(),
        findByName: vi.fn(),
        create: vi.fn(async (c) => c),
        update: vi.fn(async (c) => c),
        delete: vi.fn(async () => undefined),
    } satisfies Record<keyof ICategoryRepository, unknown>;
}

export function mockProductRepository() {
    return {
        findAll: vi.fn(),
        findById: vi.fn(),
        countByCategory: vi.fn(async () => 0),
        create: vi.fn(async (p) => p),
        update: vi.fn(async (p) => p),
        delete: vi.fn(async () => undefined),
    } satisfies Record<keyof IProductRepository, unknown>;
}

export function mockOrderRepository() {
    return {
        findAll: vi.fn(),
        findById: vi.fn(),
        countByProduct: vi.fn(async () => 0),
        create: vi.fn(async (o) => o),
        update: vi.fn(async (o) => o),
        delete: vi.fn(async () => undefined),
    } satisfies Record<keyof IOrderRepository, unknown>;
}

export const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
export const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";
export const PRODUCT_ID_2 = "33333333-3333-4333-8333-333333333333";
export const ORDER_ID = "44444444-4444-4444-8444-444444444444";

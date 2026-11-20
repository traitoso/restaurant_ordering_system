import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { getSupabase } from "../../src/config/supabase.js";

/**
 * Testes de integração: exercitam os endpoints de ponta a ponta
 * (rota → controller → service → repository → Supabase).
 *
 * Cada execução usa um sufixo único nos nomes e remove, ao final,
 * todos os registros criados — os testes podem ser executados novamente
 * sem interferência entre si.
 */

const RUN = `test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const NOT_FOUND_ID = "00000000-0000-4000-8000-000000000000";

const created = {
    categories: [] as string[],
    products: [] as string[],
    orders: [] as string[],
};

async function cleanup() {
    const supabase = getSupabase();
    if (created.orders.length) await supabase.from("orders").delete().in("id", created.orders);
    if (created.products.length) await supabase.from("products").delete().in("id", created.products);
    if (created.categories.length) await supabase.from("categories").delete().in("id", created.categories);
}

async function createCategory(name: string, extra: Record<string, unknown> = {}) {
    const res = await request(app)
        .post("/categories")
        .send({ name: `${name} ${RUN}`, ...extra });
    if (res.body.id) created.categories.push(res.body.id);
    return res;
}

async function createProduct(categoryId: string, name: string, price: number, extra: Record<string, unknown> = {}) {
    const res = await request(app)
        .post("/products")
        .send({ category_id: categoryId, name: `${name} ${RUN}`, price, ...extra });
    if (res.body.id) created.products.push(res.body.id);
    return res;
}

async function createOrder(body: Record<string, unknown>) {
    const res = await request(app).post("/orders").send(body);
    if (res.body.id) created.orders.push(res.body.id);
    return res;
}

beforeAll(async () => {
    await cleanup();
});

afterAll(async () => {
    await cleanup();
});

describe("API - rotas gerais", () => {
    it("GET / retorna informações da API", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Restaurant Ordering System - API");
    });

    it("GET /api-docs.json e /api-docs servem a documentação", async () => {
        const json = await request(app).get("/api-docs.json");
        expect(json.status).toBe(200);
        expect(json.body.openapi).toBe("3.0.3");
        expect(Object.keys(json.body.paths)).toEqual(
            expect.arrayContaining(["/categories", "/products", "/orders"])
        );

        const html = await request(app).get("/api-docs");
        expect(html.status).toBe(200);
        expect(html.text).toContain("swagger-ui");
    });

    it("rota inexistente retorna 404", async () => {
        const res = await request(app).get("/nao-existe");
        expect(res.status).toBe(404);
    });

    it("JSON malformado retorna 400", async () => {
        const res = await request(app)
            .post("/categories")
            .set("Content-Type", "application/json")
            .send('{"name": ');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("JSON inválido no corpo da requisição.");
    });
});

describe("Categories", () => {
    let categoryId: string;

    it("POST /categories cria uma categoria (201)", async () => {
        const res = await createCategory("Lanches", { description: "Hambúrgueres", icon: "🍔", display_order: 1 });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            name: `Lanches ${RUN}`,
            description: "Hambúrgueres",
            display_order: 1,
            active: true,
        });
        expect(res.body.id).toBeTypeOf("string");
        categoryId = res.body.id;
    });

    it("POST /categories com dados inválidos retorna 400", async () => {
        const res = await request(app).post("/categories").send({ name: "", display_order: -1 });
        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
    });

    it("POST /categories com nome duplicado retorna 409", async () => {
        const res = await request(app).post("/categories").send({ name: `lanches ${RUN}` });
        expect(res.status).toBe(409);
    });

    it("GET /categories lista as categorias (200)", async () => {
        const res = await request(app).get("/categories");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((c: { id: string }) => c.id === categoryId)).toBe(true);
    });

    it("GET /categories?search= e /categories/search filtram por palavra-chave", async () => {
        const res = await request(app).get("/categories").query({ search: RUN, active: "true" });
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);

        const search = await request(app).get("/categories/search").query({ keyword: RUN });
        expect(search.status).toBe(200);
        expect(search.body[0].id).toBe(categoryId);

        const noKeyword = await request(app).get("/categories/search");
        expect(noKeyword.status).toBe(400);
    });

    it("GET /categories/:id consulta por ID (200)", async () => {
        const res = await request(app).get(`/categories/${categoryId}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(categoryId);
    });

    it("GET /categories/:id retorna 404 e 400 para inexistente/inválido", async () => {
        expect((await request(app).get(`/categories/${NOT_FOUND_ID}`)).status).toBe(404);
        expect((await request(app).get("/categories/abc")).status).toBe(400);
    });

    it("PUT /categories/:id atualiza a categoria (200)", async () => {
        const res = await request(app)
            .put(`/categories/${categoryId}`)
            .send({ description: "Lanches artesanais", display_order: 5 });
        expect(res.status).toBe(200);
        expect(res.body.description).toBe("Lanches artesanais");
        expect(res.body.display_order).toBe(5);
    });

    it("PUT /categories/:id com corpo vazio retorna 400 e inexistente 404", async () => {
        expect((await request(app).put(`/categories/${categoryId}`).send({})).status).toBe(400);
        expect((await request(app).put(`/categories/${NOT_FOUND_ID}`).send({ name: "X" })).status).toBe(404);
    });

    it("DELETE /categories/:id remove a categoria (200) e depois retorna 404", async () => {
        const temp = await createCategory("Temporária");
        const res = await request(app).delete(`/categories/${temp.body.id}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Categoria removida com sucesso.");

        const again = await request(app).get(`/categories/${temp.body.id}`);
        expect(again.status).toBe(404);
    });
});

describe("Products", () => {
    let categoryId: string;
    let productId: string;

    beforeAll(async () => {
        categoryId = (await createCategory("Bebidas")).body.id;
    });

    it("POST /products cria um produto (201)", async () => {
        const res = await createProduct(categoryId, "Suco de Laranja", 9.5, {
            description: "500ml",
            image_url: "https://example.com/suco.jpg",
        });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ category_id: categoryId, price: 9.5, available: true, active: true });
        productId = res.body.id;
    });

    it("POST /products com preço negativo retorna 400", async () => {
        const res = await request(app)
            .post("/products")
            .send({ category_id: categoryId, name: "Inválido", price: -10 });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("O preço do produto deve ser maior que zero.");
    });

    it("POST /products em categoria inexistente ou inativa retorna 422", async () => {
        const missing = await request(app)
            .post("/products")
            .send({ category_id: NOT_FOUND_ID, name: "Órfão", price: 10 });
        expect(missing.status).toBe(422);

        const inactive = await createCategory("Inativa", { active: false });
        const res = await request(app)
            .post("/products")
            .send({ category_id: inactive.body.id, name: "Sem categoria ativa", price: 10 });
        expect(res.status).toBe(422);
    });

    it("GET /products lista e filtra produtos (200)", async () => {
        const all = await request(app).get("/products");
        expect(all.status).toBe(200);
        expect(all.body.some((p: { id: string }) => p.id === productId)).toBe(true);

        const filtered = await request(app)
            .get("/products")
            .query({ category_id: categoryId, search: "laranja", available: "true", active: "true" });
        expect(filtered.status).toBe(200);
        expect(filtered.body).toHaveLength(1);
    });

    it("GET /products/:id consulta por ID (200) e 404 para inexistente", async () => {
        const res = await request(app).get(`/products/${productId}`);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe(`Suco de Laranja ${RUN}`);
        expect((await request(app).get(`/products/${NOT_FOUND_ID}`)).status).toBe(404);
    });

    it("PUT /products/:id atualiza o produto (200)", async () => {
        const res = await request(app).put(`/products/${productId}`).send({ price: 10.9, available: false });
        expect(res.status).toBe(200);
        expect(res.body.price).toBe(10.9);
        expect(res.body.available).toBe(false);
    });

    it("PUT /products/:id com preço zero retorna 400", async () => {
        const res = await request(app).put(`/products/${productId}`).send({ price: 0 });
        expect(res.status).toBe(400);
    });

    it("DELETE /categories/:id com produtos vinculados retorna 409", async () => {
        const res = await request(app).delete(`/categories/${categoryId}`);
        expect(res.status).toBe(409);
    });

    it("DELETE /products/:id remove o produto (200) e depois retorna 404", async () => {
        const res = await request(app).delete(`/products/${productId}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Produto removido com sucesso.");
        expect((await request(app).get(`/products/${productId}`)).status).toBe(404);
    });
});

describe("Orders", () => {
    let burgerId: string;
    let sodaId: string;
    let unavailableId: string;
    let orderId: string;

    beforeAll(async () => {
        const categoryId = (await createCategory("Pedidos")).body.id;
        burgerId = (await createProduct(categoryId, "X-Burger", 29.9)).body.id;
        sodaId = (await createProduct(categoryId, "Refrigerante", 7.5)).body.id;
        unavailableId = (await createProduct(categoryId, "Esgotado", 5, { available: false })).body.id;
    });

    it("POST /orders cria um pedido com total calculado (201)", async () => {
        const res = await createOrder({
            customer_name: "Maria Silva",
            table_number: 12,
            notes: "Sem cebola",
            items: [
                { product_id: burgerId, quantity: 2 },
                { product_id: sodaId, quantity: 1 },
            ],
        });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ customer_name: "Maria Silva", status: "pending", total: 67.3 });
        expect(res.body.items).toHaveLength(2);
        expect(res.body.items[0]).toMatchObject({ product_id: burgerId, unit_price: 29.9, subtotal: 59.8 });
        orderId = res.body.id;
    });

    it("POST /orders sem itens retorna 400", async () => {
        const res = await request(app).post("/orders").send({ customer_name: "Ana", items: [] });
        expect(res.status).toBe(400);
    });

    it("POST /orders com produto indisponível retorna 422", async () => {
        const res = await request(app)
            .post("/orders")
            .send({ customer_name: "Ana", items: [{ product_id: unavailableId, quantity: 1 }] });
        expect(res.status).toBe(422);
    });

    it("GET /orders lista os pedidos e filtra por status (200)", async () => {
        const res = await request(app).get("/orders").query({ status: "pending" });
        expect(res.status).toBe(200);
        expect(res.body.some((o: { id: string }) => o.id === orderId)).toBe(true);
        expect((await request(app).get("/orders").query({ status: "xpto" })).status).toBe(400);
    });

    it("GET /orders/:id retorna o pedido com itens (200) e 404 para inexistente", async () => {
        const res = await request(app).get(`/orders/${orderId}`);
        expect(res.status).toBe(200);
        expect(res.body.items[0].product_name).toBe(`X-Burger ${RUN}`);
        expect((await request(app).get(`/orders/${NOT_FOUND_ID}`)).status).toBe(404);
    });

    it("PUT /orders/:id substitui itens de pedido pendente (200)", async () => {
        const res = await request(app)
            .put(`/orders/${orderId}`)
            .send({ items: [{ product_id: sodaId, quantity: 3 }], table_number: 7 });
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(22.5);
        expect(res.body.table_number).toBe(7);
        expect(res.body.items).toHaveLength(1);
    });

    it("PUT /orders/:id segue o fluxo de status e bloqueia saltos (422)", async () => {
        const jump = await request(app).put(`/orders/${orderId}`).send({ status: "delivered" });
        expect(jump.status).toBe(422);

        const preparing = await request(app).put(`/orders/${orderId}`).send({ status: "preparing" });
        expect(preparing.status).toBe(200);
        expect(preparing.body.status).toBe("preparing");

        const items = await request(app)
            .put(`/orders/${orderId}`)
            .send({ items: [{ product_id: burgerId, quantity: 1 }] });
        expect(items.status).toBe(422);
    });

    it("DELETE /products/:id de produto já pedido retorna 409", async () => {
        const res = await request(app).delete(`/products/${sodaId}`);
        expect(res.status).toBe(409);
    });

    it("DELETE /orders/:id de pedido em preparo retorna 422", async () => {
        const res = await request(app).delete(`/orders/${orderId}`);
        expect(res.status).toBe(422);
    });

    it("DELETE /orders/:id remove pedido cancelado (200)", async () => {
        const cancel = await request(app).put(`/orders/${orderId}`).send({ status: "cancelled" });
        expect(cancel.status).toBe(200);

        const res = await request(app).delete(`/orders/${orderId}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Pedido removido com sucesso.");
        expect((await request(app).get(`/orders/${orderId}`)).status).toBe(404);
    });
});

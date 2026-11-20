/**
 * Especificação OpenAPI 3 da API. Servida em /api-docs (Swagger UI)
 * e em /api-docs.json (documento bruto).
 */

const uuidParam = {
    name: "id",
    in: "path",
    required: true,
    description: "Identificador (UUID) do registro",
    schema: { type: "string", format: "uuid" },
    example: "3f2b8c1e-8a4d-4c6e-9f1a-2b7d5e9c0a11",
};

const errorResponse = (description: string, example: string) => ({
    description,
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: example },
        },
    },
});

const jsonBody = (schema: string, example: Record<string, unknown>) => ({
    required: true,
    content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` }, example } },
});

const jsonResponse = (description: string, schema: object) => ({
    description,
    content: { "application/json": { schema } },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const listOf = (name: string) => ({ type: "array", items: ref(name) });

const messageResponse = (example: string) => ({
    description: "Registro removido",
    content: { "application/json": { schema: ref("Message"), example: { message: example } } },
});

export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Restaurant Ordering System - API",
        version: "1.0.0",
        description:
            "API REST de autoatendimento para restaurantes: gerenciamento do cardápio " +
            "(categorias e produtos) e dos pedidos dos clientes.\n\n" +
            "**Códigos de erro:** 400 dados inválidos · 404 não encontrado · " +
            "409 conflito (duplicidade/vínculo) · 422 regra de negócio violada · 500 erro interno.",
    },
    tags: [
        { name: "Categories", description: "Categorias do cardápio" },
        { name: "Products", description: "Produtos do cardápio" },
        { name: "Orders", description: "Pedidos e seus itens" },
    ],
    paths: {
        "/categories": {
            get: {
                tags: ["Categories"],
                summary: "Lista todas as categorias",
                description: "Ordenadas por display_order. Aceita filtros opcionais.",
                parameters: [
                    { name: "search", in: "query", schema: { type: "string" }, description: "Busca no nome/descrição" },
                    { name: "active", in: "query", schema: { type: "boolean" }, description: "Filtra por ativas/inativas" },
                ],
                responses: {
                    200: jsonResponse("Lista de categorias", listOf("Category")),
                    400: errorResponse("Filtro inválido", 'active deve ser "true" ou "false".'),
                },
            },
            post: {
                tags: ["Categories"],
                summary: "Cadastra uma categoria",
                requestBody: jsonBody("CategoryInput", {
                    name: "Lanches",
                    description: "Hambúrgueres e sanduíches",
                    icon: "🍔",
                    display_order: 1,
                }),
                responses: {
                    201: jsonResponse("Categoria criada", ref("Category")),
                    400: errorResponse("Dados inválidos", "O nome da categoria é obrigatório."),
                    409: errorResponse("Nome duplicado", 'Já existe uma categoria com o nome "Lanches".'),
                },
            },
        },
        "/categories/search": {
            get: {
                tags: ["Categories"],
                summary: "Pesquisa categorias por palavra-chave",
                parameters: [
                    { name: "keyword", in: "query", required: true, schema: { type: "string" }, example: "lanche" },
                ],
                responses: {
                    200: jsonResponse("Categorias encontradas", listOf("Category")),
                    400: errorResponse("Palavra-chave ausente", "Palavra-chave não informada."),
                },
            },
        },
        "/categories/{id}": {
            get: {
                tags: ["Categories"],
                summary: "Consulta uma categoria",
                parameters: [uuidParam],
                responses: {
                    200: jsonResponse("Categoria encontrada", ref("Category")),
                    400: errorResponse("ID inválido", "id deve ser um UUID válido."),
                    404: errorResponse("Não encontrada", "Categoria não encontrada."),
                },
            },
            put: {
                tags: ["Categories"],
                summary: "Atualiza uma categoria",
                description: "Atualização parcial: envie apenas os campos que deseja alterar.",
                parameters: [uuidParam],
                requestBody: jsonBody("CategoryUpdate", { name: "Lanches Artesanais", active: true }),
                responses: {
                    200: jsonResponse("Categoria atualizada", ref("Category")),
                    400: errorResponse("Dados inválidos", "Nenhum campo informado para atualização."),
                    404: errorResponse("Não encontrada", "Categoria não encontrada."),
                    409: errorResponse("Nome duplicado", 'Já existe uma categoria com o nome "Bebidas".'),
                },
            },
            delete: {
                tags: ["Categories"],
                summary: "Remove uma categoria",
                description: "Regra de negócio: não é possível remover categorias com produtos vinculados.",
                parameters: [uuidParam],
                responses: {
                    200: messageResponse("Categoria removida com sucesso."),
                    404: errorResponse("Não encontrada", "Categoria não encontrada."),
                    409: errorResponse(
                        "Possui produtos",
                        "Não é possível excluir a categoria: existem 2 produto(s) vinculado(s)."
                    ),
                },
            },
        },
        "/products": {
            get: {
                tags: ["Products"],
                summary: "Lista todos os produtos",
                parameters: [
                    { name: "search", in: "query", schema: { type: "string" }, description: "Busca no nome/descrição" },
                    { name: "category_id", in: "query", schema: { type: "string", format: "uuid" } },
                    { name: "available", in: "query", schema: { type: "boolean" } },
                    { name: "active", in: "query", schema: { type: "boolean" } },
                ],
                responses: {
                    200: jsonResponse("Lista de produtos", listOf("Product")),
                    400: errorResponse("Filtro inválido", "category_id deve ser um UUID válido."),
                },
            },
            post: {
                tags: ["Products"],
                summary: "Cadastra um produto",
                description: "A categoria precisa existir e estar ativa. O preço deve ser maior que zero.",
                requestBody: jsonBody("ProductInput", {
                    category_id: "3f2b8c1e-8a4d-4c6e-9f1a-2b7d5e9c0a11",
                    name: "X-Burger",
                    description: "Pão, hambúrguer 150g, queijo e salada",
                    price: 29.9,
                    image_url: "https://example.com/x-burger.jpg",
                    available: true,
                }),
                responses: {
                    201: jsonResponse("Produto criado", ref("Product")),
                    400: errorResponse("Dados inválidos", "O preço do produto deve ser maior que zero."),
                    422: errorResponse("Categoria inválida", "Não é possível vincular produtos a uma categoria inativa."),
                },
            },
        },
        "/products/{id}": {
            get: {
                tags: ["Products"],
                summary: "Consulta um produto",
                parameters: [uuidParam],
                responses: {
                    200: jsonResponse("Produto encontrado", ref("Product")),
                    400: errorResponse("ID inválido", "id deve ser um UUID válido."),
                    404: errorResponse("Não encontrado", "Produto não encontrado."),
                },
            },
            put: {
                tags: ["Products"],
                summary: "Atualiza um produto",
                description: "Atualização parcial: envie apenas os campos que deseja alterar.",
                parameters: [uuidParam],
                requestBody: jsonBody("ProductUpdate", { price: 32.5, available: false }),
                responses: {
                    200: jsonResponse("Produto atualizado", ref("Product")),
                    400: errorResponse("Dados inválidos", "O preço do produto deve ser maior que zero."),
                    404: errorResponse("Não encontrado", "Produto não encontrado."),
                    422: errorResponse("Categoria inválida", "A categoria informada não existe."),
                },
            },
            delete: {
                tags: ["Products"],
                summary: "Remove um produto",
                description: "Regra de negócio: produtos já utilizados em pedidos não podem ser removidos.",
                parameters: [uuidParam],
                responses: {
                    200: messageResponse("Produto removido com sucesso."),
                    404: errorResponse("Não encontrado", "Produto não encontrado."),
                    409: errorResponse(
                        "Usado em pedidos",
                        "Não é possível excluir o produto: ele já foi utilizado em pedidos. Desative-o (active = false)."
                    ),
                },
            },
        },
        "/orders": {
            get: {
                tags: ["Orders"],
                summary: "Lista todos os pedidos",
                parameters: [
                    {
                        name: "status",
                        in: "query",
                        schema: { type: "string", enum: ["pending", "preparing", "ready", "delivered", "cancelled"] },
                    },
                ],
                responses: {
                    200: jsonResponse("Lista de pedidos", listOf("Order")),
                    400: errorResponse("Status inválido", "status deve ser um dos valores: pending, ..."),
                },
            },
            post: {
                tags: ["Orders"],
                summary: "Cria um pedido",
                description:
                    "Os preços são obtidos do cadastro do produto e o total é calculado pela API. " +
                    "Produtos inativos ou indisponíveis não podem ser pedidos.",
                requestBody: jsonBody("OrderInput", {
                    customer_name: "Maria Silva",
                    table_number: 12,
                    notes: "Sem cebola",
                    items: [{ product_id: "9b1c2d3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e", quantity: 2 }],
                }),
                responses: {
                    201: jsonResponse("Pedido criado", ref("Order")),
                    400: errorResponse("Dados inválidos", "O pedido deve possuir ao menos um item."),
                    422: errorResponse("Produto indisponível", 'O produto "X-Burger" não está disponível para pedidos.'),
                },
            },
        },
        "/orders/{id}": {
            get: {
                tags: ["Orders"],
                summary: "Consulta um pedido com seus itens",
                parameters: [uuidParam],
                responses: {
                    200: jsonResponse("Pedido encontrado", ref("Order")),
                    400: errorResponse("ID inválido", "id deve ser um UUID válido."),
                    404: errorResponse("Não encontrado", "Pedido não encontrado."),
                },
            },
            put: {
                tags: ["Orders"],
                summary: "Atualiza um pedido (dados, itens ou status)",
                description:
                    "Fluxo de status: pending → preparing → ready → delivered; qualquer etapa não finalizada pode ir " +
                    "para cancelled. Itens só podem ser alterados com o pedido pendente. Pedidos entregues ou " +
                    "cancelados não podem ser alterados.",
                parameters: [uuidParam],
                requestBody: jsonBody("OrderUpdate", { status: "preparing" }),
                responses: {
                    200: jsonResponse("Pedido atualizado", ref("Order")),
                    400: errorResponse("Dados inválidos", "Nenhum campo informado para atualização."),
                    404: errorResponse("Não encontrado", "Pedido não encontrado."),
                    422: errorResponse("Regra violada", 'Não é possível alterar o status do pedido de "pending" para "delivered".'),
                },
            },
            delete: {
                tags: ["Orders"],
                summary: "Remove um pedido",
                description: "Somente pedidos pendentes ou cancelados podem ser removidos.",
                parameters: [uuidParam],
                responses: {
                    200: messageResponse("Pedido removido com sucesso."),
                    404: errorResponse("Não encontrado", "Pedido não encontrado."),
                    422: errorResponse(
                        "Regra violada",
                        "Somente pedidos pendentes ou cancelados podem ser excluídos. Cancele o pedido antes."
                    ),
                },
            },
        },
    },
    components: {
        schemas: {
            Error: { type: "object", properties: { message: { type: "string" } } },
            Message: { type: "object", properties: { message: { type: "string" } } },
            Category: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string", example: "Lanches" },
                    description: { type: "string", nullable: true },
                    icon: { type: "string", nullable: true, example: "🍔" },
                    display_order: { type: "integer", example: 1 },
                    active: { type: "boolean", example: true },
                    created_at: { type: "string", format: "date-time" },
                },
            },
            CategoryInput: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", maxLength: 80 },
                    description: { type: "string", maxLength: 255, nullable: true },
                    icon: { type: "string", nullable: true },
                    display_order: { type: "integer", minimum: 0, default: 0 },
                    active: { type: "boolean", default: true },
                },
            },
            CategoryUpdate: {
                type: "object",
                properties: {
                    name: { type: "string", maxLength: 80 },
                    description: { type: "string", nullable: true },
                    icon: { type: "string", nullable: true },
                    display_order: { type: "integer", minimum: 0 },
                    active: { type: "boolean" },
                },
            },
            Product: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    category_id: { type: "string", format: "uuid" },
                    name: { type: "string", example: "X-Burger" },
                    description: { type: "string", nullable: true },
                    price: { type: "number", example: 29.9 },
                    image_url: { type: "string", nullable: true },
                    available: { type: "boolean" },
                    active: { type: "boolean" },
                    created_at: { type: "string", format: "date-time" },
                },
            },
            ProductInput: {
                type: "object",
                required: ["category_id", "name", "price"],
                properties: {
                    category_id: { type: "string", format: "uuid" },
                    name: { type: "string", maxLength: 120 },
                    description: { type: "string", nullable: true },
                    price: { type: "number", minimum: 0.01, maximum: 99999.99 },
                    image_url: { type: "string", format: "uri", nullable: true },
                    available: { type: "boolean", default: true },
                    active: { type: "boolean", default: true },
                },
            },
            ProductUpdate: {
                type: "object",
                properties: {
                    category_id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    description: { type: "string", nullable: true },
                    price: { type: "number", minimum: 0.01 },
                    image_url: { type: "string", nullable: true },
                    available: { type: "boolean" },
                    active: { type: "boolean" },
                },
            },
            OrderItem: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    product_id: { type: "string", format: "uuid" },
                    product_name: { type: "string", example: "X-Burger" },
                    quantity: { type: "integer", example: 2 },
                    unit_price: { type: "number", example: 29.9 },
                    subtotal: { type: "number", example: 59.8 },
                },
            },
            OrderItemInput: {
                type: "object",
                required: ["product_id", "quantity"],
                properties: {
                    product_id: { type: "string", format: "uuid" },
                    quantity: { type: "integer", minimum: 1, maximum: 50 },
                },
            },
            Order: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    customer_name: { type: "string", example: "Maria Silva" },
                    table_number: { type: "integer", nullable: true, example: 12 },
                    status: {
                        type: "string",
                        enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
                    },
                    notes: { type: "string", nullable: true },
                    total: { type: "number", example: 59.8 },
                    items: { type: "array", items: ref("OrderItem") },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                },
            },
            OrderInput: {
                type: "object",
                required: ["customer_name", "items"],
                properties: {
                    customer_name: { type: "string", maxLength: 100 },
                    table_number: { type: "integer", minimum: 1, maximum: 999, nullable: true },
                    notes: { type: "string", maxLength: 255, nullable: true },
                    items: { type: "array", minItems: 1, items: ref("OrderItemInput") },
                },
            },
            OrderUpdate: {
                type: "object",
                properties: {
                    customer_name: { type: "string" },
                    table_number: { type: "integer", nullable: true },
                    notes: { type: "string", nullable: true },
                    status: {
                        type: "string",
                        enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
                    },
                    items: { type: "array", minItems: 1, items: ref("OrderItemInput") },
                },
            },
        },
    },
} as const;

/** Página do Swagger UI (assets carregados do CDN, funciona também na Vercel). */
export const swaggerHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Restaurant Ordering System - API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: "/api-docs.json", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;

# 🍽️ Restaurant Ordering System – API

API REST para um **sistema de autoatendimento de restaurante**, desenvolvida na disciplina de **Desenvolvimento Back-End** (4º período – Engenharia de Software – Campus SJP) como Avaliação Final.

## 📌 Sobre o projeto

**Problema:** em restaurantes com grande movimento, o atendimento tradicional (garçom anotando pedidos) gera filas, demora e erros nos pedidos.

**Contexto:** a aplicação é o back-end de um totem/cardápio digital de autoatendimento. O cliente consulta o cardápio organizado por categorias, escolhe os produtos e faz o pedido; a cozinha acompanha o pedido pelas etapas de preparo até a entrega.

**Objetivo da API:** disponibilizar endpoints REST para gerenciar o cardápio (**categorias** e **produtos**) e os **pedidos** (com seus itens), aplicando regras de negócio do domínio, com persistência no Supabase/PostgreSQL, testes automatizados e documentação Swagger.

## 👥 Integrantes da equipe

| Nome completo |
|---------------|
| Alisson de Oliveira da Silva |
| _(adicionar integrante)_ |
| _(adicionar integrante)_ |

## 🛠️ Tecnologias utilizadas

- [Node.js](https://nodejs.org/) (≥ 20) e [TypeScript](https://www.typescriptlang.org/)
- [Express 5](https://expressjs.com/)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`) / [PostgreSQL](https://www.postgresql.org/)
- [Vitest](https://vitest.dev/) + [@vitest/coverage-v8](https://vitest.dev/guide/coverage) (testes e cobertura)
- [Supertest](https://github.com/ladjs/supertest) (testes de integração HTTP)
- [Swagger UI / OpenAPI 3](https://swagger.io/specification/) (documentação interativa)
- [tsx](https://github.com/privatenumber/tsx) (execução do TypeScript em desenvolvimento)
- [Git](https://git-scm.com/) / GitHub, GitHub Actions (CI) e [Vercel](https://vercel.com/) (deploy)

## 🧩 Entidades e relacionamentos

```
categories 1 ──── N products 1 ──── N order_items N ──── 1 orders
```

- Uma **categoria** possui vários **produtos**; cada produto pertence a exatamente uma categoria.
- Um **pedido** possui vários **itens**; cada item referencia um **produto** (relação N:N entre pedidos e produtos através de `order_items`).

### Category (Categoria)

| Atributo        | Tipo        | Descrição                                   |
|-----------------|-------------|---------------------------------------------|
| `id`            | UUID        | Identificador único (PK)                    |
| `name`          | varchar(80) | Nome da categoria (obrigatório, único)      |
| `description`   | varchar(255)| Descrição da categoria                      |
| `icon`          | varchar     | Ícone exibido no cardápio                   |
| `display_order` | integer     | Ordem de exibição (≥ 0)                     |
| `active`        | boolean     | Indica se a categoria está ativa            |
| `created_at`    | timestamptz | Data de criação                             |

### Product (Produto)

| Atributo      | Tipo          | Descrição                                       |
|---------------|---------------|-------------------------------------------------|
| `id`          | UUID          | Identificador único (PK)                        |
| `category_id` | UUID          | Categoria do produto (FK → `categories.id`)     |
| `name`        | varchar(120)  | Nome do produto (obrigatório)                   |
| `description` | text          | Descrição do produto                            |
| `price`       | numeric(10,2) | Preço (> 0)                                     |
| `image_url`   | varchar(500)  | URL da imagem                                   |
| `available`   | boolean       | Disponível no momento (ex.: não esgotado)       |
| `active`      | boolean       | Produto ativo no cardápio                       |
| `created_at`  | timestamptz   | Data de criação                                 |

### Order (Pedido)

| Atributo        | Tipo          | Descrição                                                           |
|-----------------|---------------|---------------------------------------------------------------------|
| `id`            | UUID          | Identificador único (PK)                                            |
| `customer_name` | varchar(100)  | Nome do cliente (obrigatório)                                       |
| `table_number`  | integer       | Número da mesa (1 a 999, opcional para viagem)                      |
| `status`        | varchar(20)   | `pending`, `preparing`, `ready`, `delivered` ou `cancelled`         |
| `notes`         | varchar(255)  | Observações do pedido                                               |
| `total`         | numeric(10,2) | Total calculado pela API                                            |
| `created_at` / `updated_at` | timestamptz | Datas de criação e atualização                          |

### OrderItem (Item do pedido)

| Atributo     | Tipo          | Descrição                                               |
|--------------|---------------|---------------------------------------------------------|
| `id`         | UUID          | Identificador único (PK)                                |
| `order_id`   | UUID          | Pedido (FK → `orders.id`, `ON DELETE CASCADE`)          |
| `product_id` | UUID          | Produto (FK → `products.id`, `ON DELETE RESTRICT`)      |
| `quantity`   | integer       | Quantidade (1 a 50)                                     |
| `unit_price` | numeric(10,2) | Preço do produto no momento do pedido                   |

## 📏 Regras de negócio

**Categorias**
1. O nome é obrigatório (até 80 caracteres) e **não pode se repetir** (sem diferenciar maiúsculas/minúsculas) → `409`.
2. `display_order` deve ser inteiro e não negativo → `400`.
3. **Não é possível excluir uma categoria que possui produtos** vinculados → `409`.

**Produtos**
4. O preço deve ser **maior que zero**, até 99.999,99, com no máximo 2 casas decimais → `400`.
5. O produto deve pertencer a uma **categoria existente e ativa** (no cadastro e na troca de categoria) → `422`.
6. Um produto que **já foi utilizado em pedidos não pode ser excluído** (deve ser desativado com `active: false`) → `409`.
7. Só pode ser pedido um produto **ativo e disponível** (`active` e `available`).

**Pedidos**
8. Todo pedido precisa do nome do cliente e de **pelo menos um item** → `400`.
9. Produtos inexistentes, inativos ou indisponíveis não podem ser pedidos → `422`.
10. O **preço unitário é copiado do produto** no momento do pedido e o **total é calculado pela API** (o cliente não envia preços). Itens repetidos do mesmo produto têm as quantidades somadas.
11. Todo pedido novo começa como `pending`. O status segue o fluxo
    `pending → preparing → ready → delivered`, podendo ir para `cancelled` em qualquer etapa não finalizada. Saltos ou retrocessos são bloqueados → `422`.
12. Os **itens só podem ser alterados enquanto o pedido está `pending`** → `422`.
13. Pedidos **entregues ou cancelados não podem ser alterados** → `422`.
14. Só podem ser excluídos pedidos **pendentes ou cancelados** → `422`.

**Padrão de respostas de erro:** `{ "message": "..." }` com `400` (dados inválidos / UUID inválido / JSON malformado), `404` (não encontrado), `409` (conflito), `422` (regra de negócio) e `500` (erro interno).

## 🗂️ Estrutura do projeto

```
restaurant_ordering_system/
├── database/
│   └── schema.sql              # Script SQL para recriar o banco
├── src/
│   ├── config/                 # Cliente do Supabase (lê variáveis de ambiente)
│   ├── controllers/            # Recebem a requisição HTTP e devolvem a resposta
│   ├── docs/                   # Especificação OpenAPI e página do Swagger UI
│   ├── errors/                 # Hierarquia de erros (AppError e subclasses)
│   ├── middlewares/            # Tratamento global de erros e rota 404
│   ├── models/                 # Entidades com encapsulamento e validações (POO)
│   ├── repositories/           # Acesso ao Supabase + interfaces (contratos)
│   ├── routes/                 # Definição dos endpoints
│   ├── services/               # Regras de negócio
│   ├── utils/                  # Validadores auxiliares (UUID, query string...)
│   ├── app.ts                  # Montagem do Express e injeção de dependências
│   └── server.ts               # Inicialização do servidor
├── tests/
│   ├── unit/                   # Testes unitários (models e services com mocks)
│   └── integration/            # Testes de integração (Supertest + Supabase)
├── .env.example
├── vitest.config.ts
└── package.json
```

**Fluxo das camadas:** `routes → controllers → services → repositories → Supabase`.
Os services dependem das **interfaces** dos repositórios (`ICategoryRepository`, `IProductRepository`, `IOrderRepository`), recebidas pelo construtor. Isso permite substituí-los por mocks nos testes unitários.

## ⚙️ Configuração e execução

```bash
# 1. Clonar o repositório
git clone https://github.com/traitoso/restaurant_ordering_system.git
cd restaurant_ordering_system

# 2. Instalar as dependências
npm install

# 3. Configurar as variáveis de ambiente
cp .env.example .env      # depois edite o .env com as credenciais do seu projeto Supabase

# 4. Preparar o banco: execute database/schema.sql no SQL Editor do Supabase

# 5. Iniciar a aplicação em modo desenvolvimento
npm run dev
```

A API sobe em `http://localhost:3000`, com a documentação em `http://localhost:3000/api-docs`.

| Script                     | Descrição                                        |
|----------------------------|--------------------------------------------------|
| `npm run dev`              | Executa em desenvolvimento (com reload)          |
| `npm run build`            | Compila o TypeScript para `dist/`                |
| `npm start`                | Executa a versão compilada                       |
| `npm run typecheck`        | Verifica os tipos sem gerar arquivos             |
| `npm test`                 | Executa todos os testes                          |
| `npm run test:unit`        | Executa apenas os testes unitários               |
| `npm run test:integration` | Executa apenas os testes de integração           |
| `npm run test:coverage`    | Executa todos os testes e gera a cobertura       |

## 🔐 Variáveis de ambiente

| Variável              | Descrição                                                                   |
|-----------------------|-----------------------------------------------------------------------------|
| `SUPABASE_URL`        | URL do projeto Supabase (Project Settings → API)                            |
| `SUPABASE_SECRET_KEY` | Chave secreta (`sb_secret_...` / service role). Usada **apenas no servidor** |
| `PORT`                | Porta da API (opcional, padrão `3000`)                                      |

O arquivo `.env` com as credenciais reais está no `.gitignore` e **não deve ser enviado ao repositório**. Use o `.env.example` como modelo.

## 🗄️ Banco de dados

O script completo está em [`database/schema.sql`](database/schema.sql). Resumo:

| Tabela        | PK   | Chaves estrangeiras                                                         | Restrições principais                                   |
|---------------|------|------------------------------------------------------------------------------|---------------------------------------------------------|
| `categories`  | `id` | –                                                                            | `name` único, `display_order >= 0`                      |
| `products`    | `id` | `category_id → categories.id` (`ON DELETE RESTRICT`)                        | `price > 0`                                             |
| `orders`      | `id` | –                                                                            | `status` em lista fixa, `table_number` 1–999, `total >= 0` |
| `order_items` | `id` | `order_id → orders.id` (`CASCADE`), `product_id → products.id` (`RESTRICT`) | `quantity` 1–50, `unit_price > 0`, produto único por pedido |

Todas as tabelas usam **UUID** (`gen_random_uuid()`) e têm **RLS habilitado**: somente a API, com a chave secreta, acessa os dados.

## 🔗 Endpoints da API

### Categorias

| Método | Endpoint                         | Descrição                                          |
|--------|----------------------------------|----------------------------------------------------|
| GET    | `/categories`                    | Lista categorias (filtros `?search=` e `?active=`) |
| GET    | `/categories/search?keyword=`    | Pesquisa categorias por palavra-chave              |
| GET    | `/categories/:id`                | Consulta uma categoria                             |
| POST   | `/categories`                    | Cadastra uma categoria                             |
| PUT    | `/categories/:id`                | Atualiza uma categoria                             |
| DELETE | `/categories/:id`                | Remove uma categoria                               |

### Produtos

| Método | Endpoint          | Descrição                                                                 |
|--------|-------------------|---------------------------------------------------------------------------|
| GET    | `/products`       | Lista produtos (filtros `?search=`, `?category_id=`, `?available=`, `?active=`) |
| GET    | `/products/:id`   | Consulta um produto                                                       |
| POST   | `/products`       | Cadastra um produto                                                       |
| PUT    | `/products/:id`   | Atualiza um produto                                                       |
| DELETE | `/products/:id`   | Remove um produto                                                         |

### Pedidos

| Método | Endpoint        | Descrição                                         |
|--------|-----------------|---------------------------------------------------|
| GET    | `/orders`       | Lista pedidos (filtro `?status=`)                 |
| GET    | `/orders/:id`   | Consulta um pedido com seus itens                 |
| POST   | `/orders`       | Cria um pedido                                    |
| PUT    | `/orders/:id`   | Atualiza dados, itens ou status do pedido         |
| DELETE | `/orders/:id`   | Remove um pedido (somente pendente ou cancelado)  |

### Outros

| Método | Endpoint         | Descrição                          |
|--------|------------------|------------------------------------|
| GET    | `/`              | Informações da API                 |
| GET    | `/api-docs`      | Documentação interativa (Swagger)  |
| GET    | `/api-docs.json` | Especificação OpenAPI em JSON      |

## 📨 Exemplos de requisições

**POST `/categories`**
```json
{
  "name": "Lanches",
  "description": "Hambúrgueres e sanduíches",
  "icon": "🍔",
  "display_order": 1
}
```

**PUT `/categories/:id`** (atualização parcial)
```json
{ "description": "Lanches artesanais", "active": true }
```

**POST `/products`**
```json
{
  "category_id": "3f2b8c1e-8a4d-4c6e-9f1a-2b7d5e9c0a11",
  "name": "X-Burger",
  "description": "Pão, hambúrguer 150g, queijo e salada",
  "price": 29.9,
  "image_url": "https://example.com/x-burger.jpg",
  "available": true
}
```

**PUT `/products/:id`**
```json
{ "price": 32.5, "available": false }
```

**POST `/orders`**
```json
{
  "customer_name": "Maria Silva",
  "table_number": 12,
  "notes": "Sem cebola",
  "items": [
    { "product_id": "9b1c2d3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e", "quantity": 2 },
    { "product_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d", "quantity": 1 }
  ]
}
```

Resposta (`201 Created`):
```json
{
  "id": "c0a8012e-...",
  "customer_name": "Maria Silva",
  "table_number": 12,
  "status": "pending",
  "notes": "Sem cebola",
  "total": 67.3,
  "items": [
    { "product_id": "9b1c...", "product_name": "X-Burger", "quantity": 2, "unit_price": 29.9, "subtotal": 59.8 },
    { "product_id": "1a2b...", "product_name": "Refrigerante", "quantity": 1, "unit_price": 7.5, "subtotal": 7.5 }
  ]
}
```

**PUT `/orders/:id`** (avançar status)
```json
{ "status": "preparing" }
```

**PUT `/orders/:id`** (trocar itens, somente com o pedido `pending`)
```json
{ "items": [{ "product_id": "9b1c2d3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e", "quantity": 1 }] }
```

## 🧪 Testes automatizados e cobertura

**Ferramentas:** Vitest (execução e mocks), Supertest (requisições HTTP) e `@vitest/coverage-v8` (cobertura).

**Organização:**

| Arquivo                                   | Tipo        | O que verifica                                                                    |
|-------------------------------------------|-------------|-----------------------------------------------------------------------------------|
| `tests/unit/models.test.ts`               | Unitário    | Validações e regras dos models (preço, fluxo de status, total do pedido...)       |
| `tests/unit/CategoryService.test.ts`      | Unitário    | Regras de categorias com repositórios mockados (`vi.fn`)                          |
| `tests/unit/ProductService.test.ts`       | Unitário    | Regras de produtos (categoria ativa, exclusão bloqueada...)                       |
| `tests/unit/OrderService.test.ts`         | Unitário    | Regras de pedidos (disponibilidade, preço, status, exclusão)                      |
| `tests/unit/utils.test.ts`                | Unitário    | Validadores e tradução de erros do banco                                          |
| `tests/integration/api.test.ts`           | Integração  | CRUD completo das 3 entidades via HTTP, códigos de status e dados retornados       |

```bash
npm run test:unit          # testes unitários (não acessam o banco)
npm run test:integration   # testes de integração (usam o Supabase do .env)
npm run test:coverage      # todos os testes + relatório de cobertura
```

O relatório é exibido no terminal e gerado em HTML em `coverage/index.html`. A configuração (`vitest.config.ts`) mede todo o código de `src/`, excluindo apenas `src/server.ts` (ponto de entrada que só sobe o servidor), e **falha se qualquer métrica ficar abaixo de 60%**.

**Cobertura alcançada:**

| Métrica                   | Cobertura | Mínimo exigido |
|---------------------------|-----------|----------------|
| Instruções (Statements)   | 98,85%    | 60%            |
| Ramificações (Branches)   | 95,56%    | 60%            |
| Funções (Functions)       | 98,80%    | 60%            |
| Linhas (Lines)            | 98,77%    | 60%            |

Resultado da execução: **6 arquivos de teste, 104 testes aprovados** (71 unitários + 33 de integração).

**Cuidados com o banco nos testes de integração:**
- Os testes usam o banco configurado no `.env`. O ideal é usar um **projeto Supabase separado para testes**.
- Cada execução cria registros com um sufixo único (`test-<timestamp>`) e **remove tudo o que criou** no `afterAll`, então os testes podem ser executados repetidamente sem interferência.
- Os arquivos de teste rodam em sequência (`fileParallelism: false`) para evitar concorrência no banco.

## 📘 Documentação Swagger

Com a API rodando, acesse **`http://localhost:3000/api-docs`**.

Na página é possível ver todos os endpoints agrupados por entidade (Categories, Products, Orders), com parâmetros, corpo esperado, exemplos e respostas. Para testar, clique em um endpoint → **Try it out** → preencha os dados → **Execute**. A especificação OpenAPI em JSON fica em `/api-docs.json`.

## 🚀 CI/CD e deploy

- **GitHub Actions** (`.github/workflows/ci.yml`): a cada push/PR, instala as dependências, verifica a compilação e executa os testes unitários. Se os *secrets* `SUPABASE_URL` e `SUPABASE_SECRET_KEY` estiverem configurados no repositório, também roda os testes de integração com cobertura.
- **Vercel**: a aplicação Express é publicada a partir do repositório, com as variáveis de ambiente configuradas no painel da Vercel.

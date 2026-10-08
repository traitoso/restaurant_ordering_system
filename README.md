# 🍽️ Restaurant Ordering System – API

API REST para um **sistema de autoatendimento de restaurante**, desenvolvida na disciplina de **Desenvolvimento Back-End** (4º período – Engenharia de Software – Campus SJP).

## 📌 Sobre o projeto

**Problema:** em restaurantes com grande movimento, o atendimento tradicional (garçom anotando pedidos) gera filas, demora e erros nos pedidos.

**Contexto:** a aplicação é o back-end de um totem/cardápio digital de autoatendimento, em que o próprio cliente consulta o cardápio organizado por categorias e escolhe os produtos.

**Objetivo da API:** disponibilizar endpoints REST para cadastrar, consultar, atualizar e remover os dados do cardápio (categorias e produtos), com persistência no Supabase/PostgreSQL, servindo de base para um front-end de autoatendimento.

## 👤 Estudante

**Alisson de Oliveira**

## 🛠️ Tecnologias utilizadas

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- [PostgreSQL](https://www.postgresql.org/)
- [tsx](https://github.com/privatenumber/tsx) (execução do TypeScript em desenvolvimento)
- [Git](https://git-scm.com/) / GitHub
- [Postman](https://www.postman.com/) (testes da API)

## 🧩 Entidades e relacionamentos

### Category (Categoria)

Representa um grupo do cardápio (ex.: Pizzas, Bebidas, Sobremesas).

| Atributo        | Tipo      | Descrição                                   |
|-----------------|-----------|---------------------------------------------|
| `id`            | UUID      | Identificador único (PK)                    |
| `name`          | texto     | Nome da categoria (obrigatório)             |
| `description`   | texto     | Descrição da categoria                      |
| `icon`          | texto     | Ícone exibido no cardápio                   |
| `display_order` | inteiro   | Ordem de exibição no cardápio               |
| `active`        | booleano  | Indica se a categoria está ativa            |

### Product (Produto)

Representa um item do cardápio que pode ser pedido pelo cliente.

| Atributo      | Tipo          | Descrição                                       |
|---------------|---------------|-------------------------------------------------|
| `id`          | UUID          | Identificador único (PK)                        |
| `category_id` | UUID          | Categoria à qual o produto pertence (FK)        |
| `name`        | texto         | Nome do produto (obrigatório)                   |
| `description` | texto         | Descrição do produto                            |
| `price`       | numérico      | Preço do produto (obrigatório)                  |
| `image_url`   | texto (opcional) | URL da imagem do produto                     |
| `active`      | booleano      | Indica se o produto está disponível             |

### Relacionamento

```
categories (1) ───────< (N) products
```

- Uma **categoria** possui **vários produtos**.
- Cada **produto** pertence a **uma única categoria**, através da chave estrangeira `products.category_id → categories.id`.

## 📁 Estrutura do projeto

```
src/
├── config/
│   └── supabase.ts             # Conexão com o Supabase (usa variáveis de ambiente)
├── controller/
│   ├── Categorycontroller.ts   # Trata requisições/respostas HTTP de categorias
│   └── Productcontroller.ts    # Trata requisições/respostas HTTP de produtos
├── model/
│   ├── Category.ts             # Estrutura da entidade Category
│   └── Product.ts              # Estrutura da entidade Product
├── repositories/
│   ├── CategoryRepository.ts   # Acesso e persistência de categorias no banco
│   └── ProductRepository.ts    # Acesso e persistência de produtos no banco
├── routes/
│   ├── categoryRoutes.ts       # Endpoints de /categories
│   └── productRoutes.ts        # Endpoints de /products
├── app.ts                      # Configuração do Express e registro das rotas
└── server.ts                   # Inicialização do servidor (porta 3000)
```

| Camada           | Responsabilidade                                                        |
|------------------|-------------------------------------------------------------------------|
| **Model**        | Representação das entidades e seus atributos                            |
| **Controller**   | Recebe a requisição, valida os dados básicos e devolve a resposta HTTP  |
| **Repository**   | Executa as operações no banco de dados via Supabase                     |
| **Routes**       | Define os endpoints e liga cada rota ao método do controller            |
| **Config**       | Configurações de integração com serviços externos (Supabase)            |

## ⚙️ Configuração e execução

### Pré-requisitos

- Node.js **20.6+** (o script `dev` usa `--env-file` e `--watch`)
- Conta e projeto criados no [Supabase](https://supabase.com/)

### Passo a passo

```bash
# 1. Clonar o repositório
git clone https://github.com/traitoso/restaurant_ordering_system.git

# 2. Entrar na pasta do projeto
cd restaurant_ordering_system

# 3. Instalar as dependências
npm install

# 4. Criar o arquivo .env a partir do exemplo e preencher com suas credenciais
cp .env.example .env

# 5. Iniciar em modo de desenvolvimento
npm run dev
```

A API ficará disponível em: **http://localhost:3000**

### Scripts disponíveis

| Comando         | Descrição                                              |
|-----------------|--------------------------------------------------------|
| `npm run dev`   | Executa em desenvolvimento, recarregando ao salvar     |
| `npm run build` | Compila o TypeScript para a pasta `dist/`              |
| `npm start`     | Executa a versão compilada (`dist/server.js`)          |

## 🔐 Variáveis de ambiente

O projeto utiliza as seguintes variáveis (veja o arquivo `.env.example`):

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua-chave-secreta-do-supabase
```

| Variável              | Descrição                                                      |
|-----------------------|----------------------------------------------------------------|
| `SUPABASE_URL`        | URL do projeto no Supabase (Project Settings → API)            |
| `SUPABASE_SECRET_KEY` | Chave secreta do projeto Supabase (uso apenas no back-end)     |

> ⚠️ O arquivo `.env` com as credenciais reais **não é enviado ao Git** (está listado no `.gitignore`). Nunca publique chaves, senhas ou tokens no repositório.

## 🗄️ Banco de dados

O banco é um PostgreSQL hospedado no Supabase. As tabelas usam **UUID** como chave primária, gerado automaticamente com `gen_random_uuid()`.

### Tabelas

| Tabela       | Descrição                    | Relacionamento                                    |
|--------------|------------------------------|---------------------------------------------------|
| `categories` | Categorias do cardápio       | —                                                 |
| `products`   | Produtos do cardápio         | `category_id` → `categories.id` (FK)              |

### Script SQL

Para reproduzir a estrutura, execute o script abaixo no **SQL Editor** do Supabase:

```sql
-- Tabela de categorias
create table if not exists public.categories (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    description   text,
    icon          text,
    display_order integer not null default 0,
    active        boolean not null default true
);

-- Tabela de produtos
create table if not exists public.products (
    id          uuid primary key default gen_random_uuid(),
    category_id uuid not null references public.categories(id),
    name        text not null,
    title       text,
    description text,
    price       numeric(10, 2) not null check (price >= 0),
    image_url   text,
    active      boolean not null default true
);
```

> Obs.: a coluna `title` em `products` é preenchida automaticamente pelo repositório com o mesmo valor de `name`.

## 🔗 Documentação dos endpoints

**URL base:** `http://localhost:3000`

### Raiz

| Método | Endpoint | Descrição                                 |
|--------|----------|-------------------------------------------|
| GET    | `/`      | Retorna o nome e a versão da API          |

### Categorias

| Método | Endpoint                       | Descrição                                               | Corpo (JSON) |
|--------|--------------------------------|---------------------------------------------------------|--------------|
| GET    | `/categories`                  | Lista todas as categorias                               | —            |
| GET    | `/categories/:id`              | Consulta uma categoria pelo ID                          | —            |
| GET    | `/categories/search/:keyword`  | Pesquisa categorias por palavra-chave (nome ou descrição) | —          |
| POST   | `/categories`                  | Cadastra uma categoria                                  | ✅           |
| PUT    | `/categories/:id`              | Atualiza uma categoria                                  | ✅           |
| DELETE | `/categories/:id`              | Remove uma categoria                                    | —            |

### Produtos

| Método | Endpoint          | Descrição                       | Corpo (JSON) |
|--------|-------------------|---------------------------------|--------------|
| GET    | `/products`       | Lista todos os produtos         | —            |
| GET    | `/products/:id`   | Consulta um produto pelo ID     | —            |
| POST   | `/products`       | Cadastra um produto             | ✅           |
| PUT    | `/products/:id`   | Atualiza um produto             | ✅           |
| DELETE | `/products/:id`   | Remove um produto               | —            |

### Códigos de resposta HTTP

| Código | Significado                                                  |
|--------|--------------------------------------------------------------|
| `200`  | OK – consulta, atualização ou remoção realizada com sucesso  |
| `201`  | Created – registro criado com sucesso                        |
| `400`  | Bad Request – parâmetro obrigatório não informado            |
| `404`  | Not Found – registro não encontrado                          |
| `500`  | Internal Server Error – erro ao processar a requisição       |

## 🧪 Exemplos de requisições

### Criar categoria – `POST /categories`

```json
{
  "name": "Pizzas",
  "description": "Pizzas tradicionais e especiais",
  "icon": "🍕",
  "display_order": 1,
  "active": true
}
```

**Resposta – `201 Created`**

```json
{
  "id": "6f1c2a9e-3b4d-4c8a-9f21-0a1b2c3d4e5f",
  "name": "Pizzas",
  "description": "Pizzas tradicionais e especiais",
  "icon": "🍕",
  "display_order": 1,
  "active": true
}
```

### Atualizar categoria – `PUT /categories/:id`

```json
{
  "description": "Pizzas tradicionais, especiais e doces",
  "display_order": 2
}
```

### Pesquisar categoria – `GET /categories/search/pizza`

Retorna as categorias cujo nome ou descrição contém “pizza”, ordenadas por `display_order`.

### Criar produto – `POST /products`

```json
{
  "category_id": "6f1c2a9e-3b4d-4c8a-9f21-0a1b2c3d4e5f",
  "name": "Pizza Margherita",
  "description": "Molho de tomate, mussarela e manjericão",
  "price": 49.9,
  "image_url": "https://exemplo.com/imagens/margherita.jpg",
  "active": true
}
```

### Atualizar produto – `PUT /products/:id`

```json
{
  "price": 54.9,
  "active": false
}
```

### Remover registro – `DELETE /products/:id`

**Resposta – `200 OK`**

```json
{
  "message": "Produto removido com sucesso."
}
```

## 📮 Testes com Postman

A coleção de requisições usada nos testes está na pasta `postman/collections/restaurant-ordering-system-API`, com as requisições de **Categories** e **Products** (GET, GET por ID, POST, PUT, DELETE e pesquisa). Basta importar a pasta no Postman e executar com a API rodando localmente.

## 🌿 Versionamento

O projeto é versionado com Git, com branches correspondentes às aulas (ex.: `Aula-01`, `aula-06-crud`, `aula-7`), preservando o histórico de evolução ao longo do semestre e os commits de conclusão da APS.

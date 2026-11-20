-- =====================================================================
-- Restaurant Ordering System - Estrutura do banco (Supabase/PostgreSQL)
-- Execute este script no SQL Editor do Supabase para recriar o banco.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Categorias do cardápio (ex.: Lanches, Bebidas, Sobremesas)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
    id            uuid primary key default gen_random_uuid(),
    name          varchar(80)  not null,
    description   varchar(255),
    icon          varchar(255),
    display_order integer      not null default 0 check (display_order >= 0),
    active        boolean      not null default true,
    created_at    timestamptz  not null default now(),
    constraint categories_name_unique unique (name)
);

-- ---------------------------------------------------------------------
-- Produtos do cardápio (N produtos -> 1 categoria)
-- ---------------------------------------------------------------------
create table if not exists public.products (
    id          uuid primary key default gen_random_uuid(),
    category_id uuid          not null references public.categories (id) on delete restrict,
    name        varchar(120)  not null,
    description text,
    price       numeric(10,2) not null check (price > 0),
    image_url   varchar(500),
    available   boolean       not null default true,
    active      boolean       not null default true,
    created_at  timestamptz   not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);

-- ---------------------------------------------------------------------
-- Pedidos feitos no autoatendimento
-- ---------------------------------------------------------------------
create table if not exists public.orders (
    id            uuid primary key default gen_random_uuid(),
    customer_name varchar(100)  not null,
    table_number  integer       check (table_number between 1 and 999),
    status        varchar(20)   not null default 'pending'
                  check (status in ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    notes         varchar(255),
    total         numeric(10,2) not null default 0 check (total >= 0),
    created_at    timestamptz   not null default now(),
    updated_at    timestamptz   not null default now()
);

-- ---------------------------------------------------------------------
-- Itens do pedido (tabela associativa N:N entre orders e products)
-- ---------------------------------------------------------------------
create table if not exists public.order_items (
    id         uuid primary key default gen_random_uuid(),
    order_id   uuid          not null references public.orders (id)   on delete cascade,
    product_id uuid          not null references public.products (id) on delete restrict,
    quantity   integer       not null check (quantity between 1 and 50),
    unit_price numeric(10,2) not null check (unit_price > 0),
    created_at timestamptz   not null default now(),
    constraint order_items_unique_product unique (order_id, product_id)
);

create index if not exists order_items_order_id_idx   on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------
-- Segurança: RLS habilitado. A API acessa com a chave secreta
-- (service role), que ignora RLS; a chave pública não tem acesso.
-- ---------------------------------------------------------------------
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

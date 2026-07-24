-- ============================================================================
-- 0001_schema.sql
-- Esquema base: tablas, enums, constraints e índices.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type order_status as enum ('pendiente', 'preparando', 'listo', 'entregado');

create type movement_type as enum ('venta', 'reposicion', 'ajuste');

-- ----------------------------------------------------------------------------
-- staff_users: vincula usuarios de auth.users con el personal de la cafetería.
-- Se usa como base para las políticas RLS (clientes vs. staff).
-- ----------------------------------------------------------------------------

create table staff_users (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null default 'staff' check (rol in ('staff', 'admin')),
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio numeric(10, 2) not null check (precio >= 0),
  categoria text not null,
  disponible boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index products_categoria_idx on products (categoria);
create index products_disponible_idx on products (disponible);

-- ----------------------------------------------------------------------------
-- ingredients
-- ----------------------------------------------------------------------------

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad text not null,
  stock_actual numeric(10, 2) not null default 0 check (stock_actual >= 0),
  umbral_minimo numeric(10, 2) not null default 0 check (umbral_minimo >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- recipes: cuánto de cada ingrediente consume un producto.
-- ----------------------------------------------------------------------------

create table recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  ingredient_id uuid not null references ingredients (id) on delete restrict,
  cantidad numeric(10, 2) not null check (cantidad > 0),
  unique (product_id, ingredient_id)
);

create index recipes_product_id_idx on recipes (product_id);
create index recipes_ingredient_id_idx on recipes (ingredient_id);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  mesa integer not null check (mesa > 0),
  estado order_status not null default 'pendiente',
  total numeric(10, 2) not null default 0 check (total >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index orders_estado_idx on orders (estado);
create index orders_creado_en_idx on orders (creado_en);
create index orders_mesa_idx on orders (mesa);

-- ----------------------------------------------------------------------------
-- order_items
-- precio_unitario guarda el precio del producto al momento del pedido, para
-- que cambios futuros de precio no alteren pedidos ya creados.
-- ----------------------------------------------------------------------------

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0)
);

create index order_items_order_id_idx on order_items (order_id);
create index order_items_product_id_idx on order_items (product_id);

-- ----------------------------------------------------------------------------
-- inventory_movements: historial de cada descuento/reposición de stock.
-- cantidad es negativa para consumo (venta) y positiva para reposición/ajuste.
-- ----------------------------------------------------------------------------

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  tipo movement_type not null,
  cantidad numeric(10, 2) not null,
  order_id uuid references orders (id) on delete set null,
  nota text,
  creado_en timestamptz not null default now()
);

create index inventory_movements_ingredient_id_idx on inventory_movements (ingredient_id);
create index inventory_movements_creado_en_idx on inventory_movements (creado_en);

-- ----------------------------------------------------------------------------
-- stock_alerts: generadas automáticamente cuando un ingrediente cruza su
-- umbral_minimo. Se resuelven al reponer stock por encima del umbral.
-- ----------------------------------------------------------------------------

create table stock_alerts (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  mensaje text not null,
  resuelto boolean not null default false,
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

create index stock_alerts_resuelto_idx on stock_alerts (resuelto);
create index stock_alerts_ingredient_id_idx on stock_alerts (ingredient_id);

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------

create function fn_set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_actualizado_en
  before update on products
  for each row execute function fn_set_actualizado_en();

create trigger trg_ingredients_actualizado_en
  before update on ingredients
  for each row execute function fn_set_actualizado_en();

create trigger trg_orders_actualizado_en
  before update on orders
  for each row execute function fn_set_actualizado_en();

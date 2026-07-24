-- ============================================================================
-- 0002_rls.sql
-- Row Level Security.
--
-- Modelo de acceso:
--   - Clientes (anon/authenticated sin fila en staff_users): solo pueden leer
--     el catálogo público (products) y crear/leer pedidos.
--   - Staff (fila en staff_users): acceso completo a todo.
--
-- La creación de pedidos y el cambio de estado se hacen a través de las
-- funciones RPC definidas en 0003_order_functions.sql (SECURITY DEFINER),
-- no con INSERT/UPDATE directos desde el cliente. Esto evita que un cliente
-- manipule precios, stock o el total del pedido.
-- ============================================================================

alter table staff_users enable row level security;
alter table products enable row level security;
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table inventory_movements enable row level security;
alter table stock_alerts enable row level security;

-- fn_is_staff: SECURITY DEFINER para poder consultar staff_users desde otras
-- políticas sin caer en recursión de RLS.
create function fn_is_staff()
returns boolean as $$
  select exists (
    select 1 from staff_users where id = auth.uid()
  );
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------------
-- staff_users: cada miembro del staff solo ve su propia fila.
-- ---------------------------------------------------------------------------

create policy staff_users_select_own on staff_users
  for select using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- products: catálogo público en lectura; escritura solo staff.
-- ---------------------------------------------------------------------------

create policy products_select_public on products
  for select using (true);

create policy products_write_staff on products
  for all using (fn_is_staff()) with check (fn_is_staff());

-- ---------------------------------------------------------------------------
-- ingredients / recipes: información interna, solo staff.
-- ---------------------------------------------------------------------------

create policy ingredients_all_staff on ingredients
  for all using (fn_is_staff()) with check (fn_is_staff());

create policy recipes_all_staff on recipes
  for all using (fn_is_staff()) with check (fn_is_staff());

-- ---------------------------------------------------------------------------
-- orders / order_items: lectura pública (para que el cliente vea el estado
-- de su propio pedido en tiempo real desde /mesa/[mesa]); toda escritura pasa
-- por funciones RPC, así que no hay policies de insert/update para anon.
-- ---------------------------------------------------------------------------

create policy orders_select_public on orders
  for select using (true);

create policy orders_write_staff on orders
  for update using (fn_is_staff()) with check (fn_is_staff());

create policy order_items_select_public on order_items
  for select using (true);

-- ---------------------------------------------------------------------------
-- inventory_movements / stock_alerts: solo staff. Las filas del sistema
-- (descuento por venta, alertas automáticas) se insertan vía funciones
-- SECURITY DEFINER, que no dependen de estas policies.
-- ---------------------------------------------------------------------------

create policy inventory_movements_all_staff on inventory_movements
  for all using (fn_is_staff()) with check (fn_is_staff());

create policy stock_alerts_all_staff on stock_alerts
  for all using (fn_is_staff()) with check (fn_is_staff());

-- ============================================================================
-- 0002_rls.sql
-- Row Level Security.
--
-- Modelo de acceso: la app es de uso exclusivo del staff (no hay clientes
-- anónimos). Todo requiere una fila en staff_users; sin sesión, RLS no deja
-- leer ni escribir nada.
--
-- La creación de pedidos y el cambio de estado se hacen a través de las
-- funciones RPC definidas en 0003_order_functions.sql (SECURITY DEFINER),
-- no con INSERT/UPDATE directos. Esto evita que el precio, el stock o el
-- total del pedido se manipulen desde el navegador.
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
-- products / ingredients / recipes: información interna, solo staff.
-- ---------------------------------------------------------------------------

create policy products_all_staff on products
  for all using (fn_is_staff()) with check (fn_is_staff());

create policy ingredients_all_staff on ingredients
  for all using (fn_is_staff()) with check (fn_is_staff());

create policy recipes_all_staff on recipes
  for all using (fn_is_staff()) with check (fn_is_staff());

-- ---------------------------------------------------------------------------
-- orders / order_items: lectura solo staff (para barra, dashboard, y el
-- realtime de "nuevo pedido"). La creación pasa por fn_create_order y el
-- cambio de estado por fn_update_order_status, así que no hay policies de
-- insert/update aquí.
-- ---------------------------------------------------------------------------

create policy orders_select_staff on orders
  for select using (fn_is_staff());

create policy orders_write_staff on orders
  for update using (fn_is_staff()) with check (fn_is_staff());

create policy order_items_select_staff on order_items
  for select using (fn_is_staff());

-- ---------------------------------------------------------------------------
-- inventory_movements / stock_alerts: solo staff. Las filas del sistema
-- (descuento por venta, alertas automáticas) se insertan vía funciones
-- SECURITY DEFINER, que no dependen de estas policies.
-- ---------------------------------------------------------------------------

create policy inventory_movements_all_staff on inventory_movements
  for all using (fn_is_staff()) with check (fn_is_staff());

create policy stock_alerts_all_staff on stock_alerts
  for all using (fn_is_staff()) with check (fn_is_staff());

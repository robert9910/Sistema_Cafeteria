-- ============================================================================
-- 0004_reporting_views.sql
-- Vistas de solo lectura para el dashboard. security_invoker hace que cada
-- vista respete la RLS del usuario que consulta, no la del dueño de la vista.
-- ============================================================================

create view v_productos_mas_vendidos
with (security_invoker = true) as
select
  p.id as product_id,
  p.nombre,
  p.categoria,
  sum(oi.cantidad) as unidades_vendidas,
  sum(oi.cantidad * oi.precio_unitario) as ingresos
from order_items oi
join orders o on o.id = oi.order_id
join products p on p.id = oi.product_id
where o.estado in ('listo', 'entregado')
group by p.id, p.nombre, p.categoria
order by unidades_vendidas desc;

create view v_horas_pico
with (security_invoker = true) as
select
  extract(hour from creado_en)::int as hora,
  count(*) as pedidos
from orders
group by hora
order by hora;

create view v_insumos_mas_consumidos
with (security_invoker = true) as
select
  i.id as ingredient_id,
  i.nombre,
  i.unidad,
  sum(-im.cantidad) as cantidad_consumida
from inventory_movements im
join ingredients i on i.id = im.ingredient_id
where im.tipo = 'venta'
group by i.id, i.nombre, i.unidad
order by cantidad_consumida desc;

revoke all on v_productos_mas_vendidos from public;
revoke all on v_horas_pico from public;
revoke all on v_insumos_mas_consumidos from public;

grant select on v_productos_mas_vendidos to authenticated;
grant select on v_horas_pico to authenticated;
grant select on v_insumos_mas_consumidos to authenticated;

-- ============================================================================
-- 0003_order_functions.sql
-- Lógica de negocio como funciones SECURITY DEFINER. El staff nunca
-- inserta/actualiza orders, order_items o ingredients directamente: todo
-- pasa por aquí, así el servidor de Postgres controla precios, transiciones
-- de estado y el descuento de stock (con locking a nivel de fila para que
-- pedidos concurrentes no descuadren el inventario).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- fn_create_order: el barista crea un pedido a partir de items
-- {product_id, cantidad}. El precio se toma del catálogo en este momento
-- (no lo envía el cliente). Solo staff.
-- ----------------------------------------------------------------------------

create function fn_create_order(p_mesa integer, p_items jsonb)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_item jsonb;
  v_product products;
  v_cantidad integer;
  v_total numeric(10, 2) := 0;
begin
  if not fn_is_staff() then
    raise exception 'No autorizado';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe tener al menos un producto';
  end if;

  insert into orders (mesa, estado, total)
  values (p_mesa, 'pendiente', 0)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_cantidad := (v_item->>'cantidad')::integer;

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad inválida para el producto %', v_item->>'product_id';
    end if;

    -- Lock para que la disponibilidad no cambie a mitad de la transacción.
    select * into v_product from products
      where id = (v_item->>'product_id')::uuid
      for update;

    if not found then
      raise exception 'El producto % no existe', v_item->>'product_id';
    end if;

    if not v_product.disponible then
      raise exception '% no está disponible', v_product.nombre;
    end if;

    insert into order_items (order_id, product_id, cantidad, precio_unitario)
    values (v_order.id, v_product.id, v_cantidad, v_product.precio);

    v_total := v_total + v_product.precio * v_cantidad;
  end loop;

  update orders set total = v_total where id = v_order.id
    returning * into v_order;

  return v_order;
end;
$$;

grant execute on function fn_create_order(integer, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- fn_update_order_status: cambia el estado de un pedido. Solo staff.
-- Al transicionar a 'listo' (y solo la primera vez que ocurre esa
-- transición) descuenta cada insumo de la receta de cada item, dentro de
-- la misma transacción de la función. El UPDATE sobre ingredients toma un
-- lock de fila por insumo, así que dos pedidos concurrentes que comparten
-- un ingrediente se serializan correctamente en vez de perder un descuento.
-- ----------------------------------------------------------------------------

create function fn_update_order_status(p_order_id uuid, p_new_status order_status)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_estado_anterior order_status;
  v_item record;
  v_receta record;
begin
  if not fn_is_staff() then
    raise exception 'No autorizado';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'El pedido % no existe', p_order_id;
  end if;

  v_estado_anterior := v_order.estado;

  update orders set estado = p_new_status where id = p_order_id
    returning * into v_order;

  if p_new_status = 'listo' and v_estado_anterior <> 'listo' then
    for v_item in
      select product_id, cantidad from order_items where order_id = p_order_id
    loop
      for v_receta in
        select ingredient_id, cantidad from recipes where product_id = v_item.product_id
      loop
        -- greatest(..., 0): si el stock ya estaba desalineado no bloqueamos la
        -- entrega del pedido; el faltante queda reflejado en el movimiento igual.
        update ingredients
          set stock_actual = greatest(stock_actual - (v_receta.cantidad * v_item.cantidad), 0)
          where id = v_receta.ingredient_id;

        insert into inventory_movements (ingredient_id, tipo, cantidad, order_id, nota)
        values (
          v_receta.ingredient_id,
          'venta',
          -(v_receta.cantidad * v_item.cantidad),
          p_order_id,
          'Descuento automático al marcar el pedido como listo'
        );
      end loop;
    end loop;
  end if;

  return v_order;
end;
$$;

grant execute on function fn_update_order_status(uuid, order_status) to authenticated;

-- ----------------------------------------------------------------------------
-- fn_reponer_stock: repone stock de un insumo y deja registro en
-- inventory_movements en la misma transacción. Solo staff.
-- ----------------------------------------------------------------------------

create function fn_reponer_stock(p_ingredient_id uuid, p_cantidad numeric, p_nota text default null)
returns ingredients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ingredient ingredients;
begin
  if not fn_is_staff() then
    raise exception 'No autorizado';
  end if;

  if p_cantidad <= 0 then
    raise exception 'La cantidad a reponer debe ser mayor a cero';
  end if;

  update ingredients
    set stock_actual = stock_actual + p_cantidad
    where id = p_ingredient_id
    returning * into v_ingredient;

  if not found then
    raise exception 'El insumo % no existe', p_ingredient_id;
  end if;

  insert into inventory_movements (ingredient_id, tipo, cantidad, nota)
  values (p_ingredient_id, 'reposicion', p_cantidad, p_nota);

  return v_ingredient;
end;
$$;

grant execute on function fn_reponer_stock(uuid, numeric, text) to authenticated;

-- ----------------------------------------------------------------------------
-- fn_sync_product_availability: se dispara cuando cambia el stock o el
-- umbral de un insumo.
--   - Si el insumo cruza el umbral hacia abajo: apaga (disponible = false)
--     todos los productos cuya receta lo use y crea una stock_alert.
--   - Si se repone por encima del umbral: reactiva los productos cuyos
--     insumos están todos por encima de su umbral, y resuelve la alerta.
-- ----------------------------------------------------------------------------

create function fn_sync_product_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estaba_bajo boolean;
  v_esta_bajo boolean;
  v_product_id uuid;
begin
  v_estaba_bajo := old.stock_actual <= old.umbral_minimo;
  v_esta_bajo := new.stock_actual <= new.umbral_minimo;

  if v_esta_bajo and not v_estaba_bajo then
    update products
      set disponible = false
      where id in (select product_id from recipes where ingredient_id = new.id);

    insert into stock_alerts (ingredient_id, mensaje)
    values (
      new.id,
      format('%s bajo el umbral mínimo (%s %s restante, mínimo %s %s)',
        new.nombre, new.stock_actual, new.unidad, new.umbral_minimo, new.unidad)
    );

  elsif v_estaba_bajo and not v_esta_bajo then
    for v_product_id in
      select distinct product_id from recipes where ingredient_id = new.id
    loop
      if not exists (
        select 1
        from recipes r
        join ingredients i on i.id = r.ingredient_id
        where r.product_id = v_product_id and i.stock_actual <= i.umbral_minimo
      ) then
        update products set disponible = true where id = v_product_id;
      end if;
    end loop;

    update stock_alerts
      set resuelto = true, resuelto_en = now()
      where ingredient_id = new.id and resuelto = false;
  end if;

  return new;
end;
$$;

create trigger trg_sync_product_availability
  after update of stock_actual, umbral_minimo on ingredients
  for each row
  execute function fn_sync_product_availability();

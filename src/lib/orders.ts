import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Order, OrderStatus, Product } from "@/types/database";

export type CartItem = { product_id: string; cantidad: number };

export async function getMenu(supabase: SupabaseClient<Database>): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("categoria")
    .order("nombre");

  if (error) throw error;
  return data;
}

export async function createOrder(
  supabase: SupabaseClient<Database>,
  mesa: number,
  items: CartItem[]
): Promise<Order> {
  const { data, error } = await supabase.rpc("fn_create_order", {
    p_mesa: mesa,
    p_items: items,
  });

  if (error) throw error;
  return data;
}

export type OrderWithItems = Order & {
  order_items: { id: string; product_id: string; cantidad: number; precio_unitario: number; products: { nombre: string } }[];
};

export async function getOrder(
  supabase: SupabaseClient<Database>,
  orderId: string
): Promise<OrderWithItems> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id, product_id, cantidad, precio_unitario, products(nombre))")
    .eq("id", orderId)
    .single();

  if (error) throw error;
  return data as unknown as OrderWithItems;
}

const ESTADOS_ACTIVOS: OrderStatus[] = ["pendiente", "preparando", "listo"];

export async function getActiveOrders(supabase: SupabaseClient<Database>): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id, product_id, cantidad, precio_unitario, products(nombre))")
    .in("estado", ESTADOS_ACTIVOS)
    .order("creado_en", { ascending: true });

  if (error) throw error;
  return data as unknown as OrderWithItems[];
}

export async function updateOrderStatus(
  supabase: SupabaseClient<Database>,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const { data, error } = await supabase.rpc("fn_update_order_status", {
    p_order_id: orderId,
    p_new_status: status,
  });

  if (error) throw error;
  return data;
}

export const SIGUIENTE_ESTADO: Record<OrderStatus, OrderStatus | null> = {
  pendiente: "preparando",
  preparando: "listo",
  listo: "entregado",
  entregado: null,
};

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, HoraPico, InsumoMasConsumido, ProductoMasVendido } from "@/types/database";

export async function getProductosMasVendidos(
  supabase: SupabaseClient<Database>,
  limit = 10
): Promise<ProductoMasVendido[]> {
  const { data, error } = await supabase
    .from("v_productos_mas_vendidos")
    .select("*")
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getHorasPico(supabase: SupabaseClient<Database>): Promise<HoraPico[]> {
  const { data, error } = await supabase.from("v_horas_pico").select("*");
  if (error) throw error;
  return data;
}

export async function getInsumosMasConsumidos(
  supabase: SupabaseClient<Database>,
  limit = 10
): Promise<InsumoMasConsumido[]> {
  const { data, error } = await supabase
    .from("v_insumos_mas_consumidos")
    .select("*")
    .limit(limit);

  if (error) throw error;
  return data;
}

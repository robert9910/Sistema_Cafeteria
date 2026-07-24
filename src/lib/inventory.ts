import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Ingredient, StockAlert } from "@/types/database";

export async function getIngredients(supabase: SupabaseClient<Database>): Promise<Ingredient[]> {
  const { data, error } = await supabase.from("ingredients").select("*").order("nombre");
  if (error) throw error;
  return data;
}

export type AlertaConInsumo = StockAlert & { ingredients: { nombre: string } };

export async function getAlertasActivas(supabase: SupabaseClient<Database>): Promise<AlertaConInsumo[]> {
  const { data, error } = await supabase
    .from("stock_alerts")
    .select("*, ingredients(nombre)")
    .eq("resuelto", false)
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return data as unknown as AlertaConInsumo[];
}

export async function reponerStock(
  supabase: SupabaseClient<Database>,
  ingredientId: string,
  cantidad: number,
  nota?: string
): Promise<Ingredient> {
  const { data, error } = await supabase.rpc("fn_reponer_stock", {
    p_ingredient_id: ingredientId,
    p_cantidad: cantidad,
    p_nota: nota ?? null,
  });

  if (error) throw error;
  return data;
}

export async function actualizarUmbral(
  supabase: SupabaseClient<Database>,
  ingredientId: string,
  umbralMinimo: number
): Promise<Ingredient> {
  const { data, error } = await supabase
    .from("ingredients")
    .update({ umbral_minimo: umbralMinimo })
    .eq("id", ingredientId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

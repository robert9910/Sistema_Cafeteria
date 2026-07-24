import { createClient } from "@/lib/supabase/server";
import { getIngredients, getAlertasActivas } from "@/lib/inventory";
import { StaffHeader } from "@/components/ui/StaffHeader";
import { InventarioClient } from "@/components/inventario/InventarioClient";

export default async function InventarioPage() {
  const supabase = await createClient();
  const [ingredients, alertas] = await Promise.all([
    getIngredients(supabase),
    getAlertasActivas(supabase),
  ]);

  return (
    <>
      <StaffHeader activo="/inventario" />
      <InventarioClient ingredientsIniciales={ingredients} alertasIniciales={alertas} />
    </>
  );
}

"use client";

import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";
import type { AlertaConInsumo } from "@/lib/inventory";
import type { Ingredient } from "@/types/database";
import { IngredientRow } from "@/components/inventario/IngredientRow";

export function InventarioClient({
  ingredientsIniciales,
  alertasIniciales,
}: {
  ingredientsIniciales: Ingredient[];
  alertasIniciales: AlertaConInsumo[];
}) {
  const { ingredients, alertas } = useRealtimeInventory({
    ingredients: ingredientsIniciales,
    alertas: alertasIniciales,
  });

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Inventario</h1>

      {alertas.length > 0 && (
        <section className="mb-6 space-y-2">
          {alertas.map((alerta) => (
            <div key={alerta.id} className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {alerta.mensaje}
            </div>
          ))}
        </section>
      )}

      <table className="w-full text-left text-sm">
        <thead className="text-neutral-500">
          <tr>
            <th className="py-2">Insumo</th>
            <th className="py-2">Stock</th>
            <th className="py-2">Umbral mínimo</th>
            <th className="py-2">Reponer</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient) => (
            <IngredientRow key={ingredient.id} ingredient={ingredient} />
          ))}
        </tbody>
      </table>
    </main>
  );
}

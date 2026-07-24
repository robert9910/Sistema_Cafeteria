"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { actualizarUmbral, reponerStock } from "@/lib/inventory";
import type { Ingredient } from "@/types/database";

export function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  const [umbral, setUmbral] = useState(ingredient.umbral_minimo);
  const [cantidadReponer, setCantidadReponer] = useState("");
  const [guardando, setGuardando] = useState(false);

  const bajoUmbral = ingredient.stock_actual <= ingredient.umbral_minimo;

  async function guardarUmbral() {
    if (umbral === ingredient.umbral_minimo) return;
    await actualizarUmbral(createClient(), ingredient.id, umbral);
  }

  async function reponer() {
    const cantidad = Number(cantidadReponer);
    if (!cantidad || cantidad <= 0) return;

    setGuardando(true);
    try {
      await reponerStock(createClient(), ingredient.id, cantidad);
      setCantidadReponer("");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <tr className="border-t border-neutral-100">
      <td className="py-2">{ingredient.nombre}</td>
      <td className={`py-2 ${bajoUmbral ? "font-medium text-red-600" : ""}`}>
        {ingredient.stock_actual} {ingredient.unidad}
      </td>
      <td className="py-2">
        <input
          type="number"
          min={0}
          value={umbral}
          onChange={(e) => setUmbral(Number(e.target.value))}
          onBlur={guardarUmbral}
          className="w-20 rounded-md border border-neutral-300 px-2 py-1"
        />
        <span className="ml-1 text-neutral-500">{ingredient.unidad}</span>
      </td>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="0"
            value={cantidadReponer}
            onChange={(e) => setCantidadReponer(e.target.value)}
            className="w-20 rounded-md border border-neutral-300 px-2 py-1"
          />
          <button
            type="button"
            onClick={reponer}
            disabled={guardando}
            className="rounded-md bg-neutral-900 px-3 py-1 text-white disabled:opacity-50"
          >
            +
          </button>
        </div>
      </td>
    </tr>
  );
}

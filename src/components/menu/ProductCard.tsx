import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/database";

export function ProductCard({
  producto,
  cantidad,
  onCambiarCantidad,
}: {
  producto: Product;
  cantidad: number;
  onCambiarCantidad: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
      <div>
        <p className={`font-medium ${!producto.disponible ? "text-neutral-400" : ""}`}>
          {producto.nombre}
        </p>
        <p className="text-sm text-neutral-500">{formatCurrency(producto.precio)}</p>
        {!producto.disponible && <p className="text-xs text-red-600">Agotado por ahora</p>}
      </div>

      {producto.disponible ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onCambiarCantidad(-1)}
            disabled={cantidad === 0}
            className="h-8 w-8 rounded-full border border-neutral-300 text-lg disabled:opacity-30"
          >
            −
          </button>
          <span className="w-4 text-center">{cantidad}</span>
          <button
            type="button"
            onClick={() => onCambiarCantidad(1)}
            className="h-8 w-8 rounded-full border border-neutral-300 text-lg"
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}

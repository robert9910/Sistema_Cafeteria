import { formatCurrency } from "@/lib/format";
import type { CartItem } from "@/lib/orders";
import type { Product } from "@/types/database";

export function CarritoResumen({
  items,
  total,
  enviando,
  deshabilitado,
  onConfirmar,
}: {
  items: (CartItem & { producto: Product })[];
  total: number;
  enviando: boolean;
  deshabilitado: boolean;
  onConfirmar: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4">
      <div className="mx-auto max-w-2xl">
        <ul className="mb-3 max-h-32 space-y-1 overflow-y-auto text-sm text-neutral-600">
          {items.map((item) => (
            <li key={item.product_id} className="flex justify-between">
              <span>
                {item.cantidad}× {item.producto.nombre}
              </span>
              <span>{formatCurrency(item.producto.precio * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={enviando || deshabilitado}
          className="flex w-full items-center justify-between rounded-md bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          <span>{enviando ? "Enviando..." : deshabilitado ? "Ingresa el número de mesa" : "Crear pedido"}</span>
          <span>{formatCurrency(total)}</span>
        </button>
      </div>
    </div>
  );
}

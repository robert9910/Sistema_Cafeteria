"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createOrder, type CartItem } from "@/lib/orders";
import type { Product } from "@/types/database";
import { ProductoCard } from "@/components/pedidos/ProductoCard";
import { CarritoResumen } from "@/components/pedidos/CarritoResumen";

export function NuevoPedidoClient({ productosIniciales }: { productosIniciales: Product[] }) {
  const [mesa, setMesa] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const grupos = new Map<string, Product[]>();
    for (const producto of productosIniciales) {
      const grupo = grupos.get(producto.categoria) ?? [];
      grupo.push(producto);
      grupos.set(producto.categoria, grupo);
    }
    return Array.from(grupos.entries());
  }, [productosIniciales]);

  const productosPorId = useMemo(
    () => new Map(productosIniciales.map((p) => [p.id, p])),
    [productosIniciales]
  );

  const items: (CartItem & { producto: Product })[] = Object.entries(cart)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([product_id, cantidad]) => ({
      product_id,
      cantidad,
      producto: productosPorId.get(product_id)!,
    }));

  const total = items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  const mesaNumero = Number(mesa);
  const mesaValida = Number.isInteger(mesaNumero) && mesaNumero > 0;

  function cambiarCantidad(productId: string, delta: number) {
    setCart((prev) => {
      const actual = prev[productId] ?? 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [productId]: nueva };
    });
  }

  async function crearPedido() {
    if (!mesaValida || items.length === 0) return;

    setEnviando(true);
    setError(null);
    setConfirmacion(null);

    try {
      const supabase = createClient();
      await createOrder(
        supabase,
        mesaNumero,
        items.map(({ product_id, cantidad }) => ({ product_id, cantidad }))
      );
      setConfirmacion(`Pedido enviado a la mesa ${mesaNumero}.`);
      setCart({});
      setMesa("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-32">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Nuevo pedido</h1>
        <div className="mt-3">
          <label htmlFor="mesa" className="text-sm text-neutral-600">
            Mesa
          </label>
          <input
            id="mesa"
            type="number"
            min={1}
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            placeholder="Número de mesa"
            className="mt-1 w-32 rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </header>

      {confirmacion && (
        <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {confirmacion}
        </p>
      )}

      {categorias.map(([categoria, productos]) => (
        <section key={categoria} className="mb-8">
          <h2 className="mb-3 text-lg font-medium">{categoria}</h2>
          <div className="space-y-3">
            {productos.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                cantidad={cart[producto.id] ?? 0}
                onCambiarCantidad={(delta) => cambiarCantidad(producto.id, delta)}
              />
            ))}
          </div>
        </section>
      ))}

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <CarritoResumen
        total={total}
        items={items}
        enviando={enviando}
        deshabilitado={!mesaValida}
        onConfirmar={crearPedido}
      />
    </main>
  );
}

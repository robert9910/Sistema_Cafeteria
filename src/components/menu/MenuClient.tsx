"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createOrder, type CartItem } from "@/lib/orders";
import type { Order, Product } from "@/types/database";
import { ProductCard } from "@/components/menu/ProductCard";
import { CartSummary } from "@/components/menu/CartSummary";
import { OrderTracker } from "@/components/menu/OrderTracker";

export function MenuClient({
  mesa,
  productosIniciales,
}: {
  mesa: number;
  productosIniciales: Product[];
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pedido, setPedido] = useState<Order | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function cambiarCantidad(productId: string, delta: number) {
    setCart((prev) => {
      const actual = prev[productId] ?? 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [productId]: nueva };
    });
  }

  async function confirmarPedido() {
    setEnviando(true);
    setError(null);

    try {
      const supabase = createClient();
      const orden = await createOrder(
        supabase,
        mesa,
        items.map(({ product_id, cantidad }) => ({ product_id, cantidad }))
      );
      setPedido(orden);
      setCart({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el pedido.");
    } finally {
      setEnviando(false);
    }
  }

  if (pedido) {
    return <OrderTracker mesa={mesa} pedidoInicial={pedido} onNuevoPedido={() => setPedido(null)} />;
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-32">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Mesa {mesa}</h1>
        <p className="text-neutral-500">Elige lo que quieras y agrégalo al carrito.</p>
      </header>

      {categorias.map(([categoria, productos]) => (
        <section key={categoria} className="mb-8">
          <h2 className="mb-3 text-lg font-medium">{categoria}</h2>
          <div className="space-y-3">
            {productos.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                cantidad={cart[producto.id] ?? 0}
                onCambiarCantidad={(delta) => cambiarCantidad(producto.id, delta)}
              />
            ))}
          </div>
        </section>
      ))}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <CartSummary total={total} items={items} enviando={enviando} onConfirmar={confirmarPedido} />
    </main>
  );
}

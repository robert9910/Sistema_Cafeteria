import { createClient } from "@/lib/supabase/server";
import { getProductosMasVendidos, getHorasPico, getInsumosMasConsumidos } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/format";
import { StaffHeader } from "@/components/ui/StaffHeader";
import { BarList } from "@/components/dashboard/BarList";
import { HorasPicoChart } from "@/components/dashboard/HorasPicoChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [productos, horas, insumos] = await Promise.all([
    getProductosMasVendidos(supabase),
    getHorasPico(supabase),
    getInsumosMasConsumidos(supabase),
  ]);

  return (
    <>
      <StaffHeader activo="/dashboard" />
      <main className="mx-auto max-w-3xl space-y-10 p-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>

        <section>
          <h2 className="mb-3 font-medium text-neutral-600">Productos más vendidos</h2>
          <BarList
            items={productos.map((p) => ({
              etiqueta: p.nombre,
              valor: p.unidades_vendidas,
              detalle: `${p.unidades_vendidas} · ${formatCurrency(p.ingresos)}`,
            }))}
          />
        </section>

        <section>
          <h2 className="mb-3 font-medium text-neutral-600">Horas pico</h2>
          <HorasPicoChart horas={horas} />
        </section>

        <section>
          <h2 className="mb-3 font-medium text-neutral-600">Insumos que más se agotan</h2>
          <BarList
            items={insumos.map((i) => ({
              etiqueta: i.nombre,
              valor: i.cantidad_consumida,
              detalle: `${i.cantidad_consumida} ${i.unidad}`,
            }))}
          />
        </section>
      </main>
    </>
  );
}

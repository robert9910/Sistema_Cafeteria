import type { OrderStatus } from "@/types/database";

const ESTILOS: Record<OrderStatus, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  preparando: "bg-blue-100 text-blue-800",
  listo: "bg-emerald-100 text-emerald-800",
  entregado: "bg-neutral-200 text-neutral-600",
};

const ETIQUETAS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
};

export function EstadoBadge({ estado }: { estado: OrderStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${ESTILOS[estado]}`}>
      {ETIQUETAS[estado]}
    </span>
  );
}

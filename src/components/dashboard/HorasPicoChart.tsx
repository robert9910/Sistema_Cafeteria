import { formatHour } from "@/lib/format";
import type { HoraPico } from "@/types/database";

export function HorasPicoChart({ horas }: { horas: HoraPico[] }) {
  const porHora = new Map(horas.map((h) => [h.hora, h.pedidos]));
  const max = Math.max(1, ...horas.map((h) => h.pedidos));

  return (
    <div className="flex h-32 items-end gap-1">
      {Array.from({ length: 24 }, (_, hora) => {
        const pedidos = porHora.get(hora) ?? 0;
        return (
          <div key={hora} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-neutral-900"
              style={{ height: `${(pedidos / max) * 100}%`, minHeight: pedidos > 0 ? 2 : 0 }}
              title={`${formatHour(hora)}: ${pedidos} pedidos`}
            />
            {hora % 3 === 0 && (
              <span className="text-[10px] text-neutral-400">{hora}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

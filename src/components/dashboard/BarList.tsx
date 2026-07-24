export function BarList({
  items,
}: {
  items: { etiqueta: string; valor: number; detalle?: string }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.valor));

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">Todavía no hay datos suficientes.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.etiqueta}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{item.etiqueta}</span>
            <span className="text-neutral-500">{item.detalle ?? item.valor}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100">
            <div
              className="h-2 rounded-full bg-neutral-900"
              style={{ width: `${(item.valor / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

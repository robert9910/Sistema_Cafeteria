import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMenu } from "@/lib/orders";
import { MenuClient } from "@/components/menu/MenuClient";

export default async function MesaPage({ params }: { params: Promise<{ mesa: string }> }) {
  const { mesa } = await params;
  const mesaNumero = Number(mesa);

  if (!Number.isInteger(mesaNumero) || mesaNumero <= 0) {
    notFound();
  }

  const supabase = await createClient();
  const productos = await getMenu(supabase);

  return <MenuClient mesa={mesaNumero} productosIniciales={productos} />;
}

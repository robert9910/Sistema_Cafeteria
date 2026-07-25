import { createClient } from "@/lib/supabase/server";
import { getMenu } from "@/lib/orders";
import { StaffHeader } from "@/components/ui/StaffHeader";
import { NuevoPedidoClient } from "@/components/pedidos/NuevoPedidoClient";

export default async function NuevoPedidoPage() {
  const supabase = await createClient();
  const productos = await getMenu(supabase);

  return (
    <>
      <StaffHeader activo="/barra/nuevo" />
      <NuevoPedidoClient productosIniciales={productos} />
    </>
  );
}

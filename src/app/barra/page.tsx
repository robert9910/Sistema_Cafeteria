import { createClient } from "@/lib/supabase/server";
import { getActiveOrders } from "@/lib/orders";
import { StaffHeader } from "@/components/ui/StaffHeader";
import { BarraClient } from "@/components/barra/BarraClient";

export default async function BarraPage() {
  const supabase = await createClient();
  const pedidosIniciales = await getActiveOrders(supabase);

  return (
    <>
      <StaffHeader activo="/barra" />
      <BarraClient pedidosIniciales={pedidosIniciales} />
    </>
  );
}

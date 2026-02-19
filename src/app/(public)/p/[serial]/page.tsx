import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildSignedQrToken } from "@/lib/qr/signature";
import QrClient from "./qr-client";

export default async function PassPreviewPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  const supabaseAdmin = createSupabaseAdminClient();

const { data: pass, error } = await supabaseAdmin
  .from("passes")
  .select(
    `
      serial_number,
      current_stamps,
      lifetime_stamps,
      restaurant_id,
      restaurants (
        name,
        stamp_limit
      ),
      customers (
        full_name
      )
    `
  )
  .eq("serial_number", serial)
  .single();

  if (error || !pass) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Pass no encontrado</h1>
      </main>
    );
  }

  const restaurant = (pass as any).restaurants;
  const restaurantName = restaurant?.name ?? "Restaurante";
  const customer = (pass as any).customers;
  const ownerName = customer?.full_name ?? "Cliente";
  const stampLimit = restaurant?.stamp_limit ?? 6;

  const payload = `${pass.restaurant_id}:${pass.serial_number}`;
  const token = buildSignedQrToken(payload);

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4">
        <div>
            <h1 className="text-2xl font-semibold">{ownerName}</h1>
          <h2 className="text-xl font-semibold">{restaurantName}</h2>
          <p className="text-sm text-gray-600">
            Sellos: {pass.current_stamps}/{stampLimit} · Total: {pass.lifetime_stamps}
          </p>
        </div>

        <QrClient value={token} />
      </div>
    </main>
  );
}
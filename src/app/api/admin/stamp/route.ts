import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { verifySignedQrToken } from "@/lib/qr/signature";

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient();

  // 1) Debe estar logueado (staff)
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2) Recibimos token del QR
  const { token } = await req.json().catch(() => ({ token: "" }));
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  // 3) Verificamos firma
  const verified = verifySignedQrToken(token);
  if (!verified.ok || !verified.payload) {
    return NextResponse.json({ error: "QR inválido (firma incorrecta)" }, { status: 400 });
  }

  // payload = `${restaurantId}:${serial}`
  const [restaurantId, serial] = verified.payload.split(":");
  if (!restaurantId || !serial) {
    return NextResponse.json({ error: "QR inválido (payload)" }, { status: 400 });
  }

  // 4) Buscar pass en DB y confirmar que pertenece al restaurantId del token
  const { data: pass, error: passErr } = await supabase
    .from("passes")
    .select("id, restaurant_id, current_stamps, lifetime_stamps, reward_unlocked_count")
    .eq("serial_number", serial)
    .single();

  if (passErr || !pass) {
    return NextResponse.json({ error: "Pass no encontrado" }, { status: 404 });
  }

  if (pass.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: "QR no coincide con el restaurante" }, { status: 400 });
  }

  // 5) (RECOMENDADO) Check extra: el usuario debe ser member de ese restaurante
  // Esto depende de cómo estás manejando “restaurante activo”.
  // Por ahora validamos membership con is_member_of_restaurant() via RPC simple:
  const { data: isMember, error: memberErr } = await supabase.rpc("is_member_of_restaurant", {
    rid: restaurantId,
  });

  if (memberErr || !isMember) {
    return NextResponse.json({ error: "No tienes permisos para este restaurante" }, { status: 403 });
  }

  // 6) Registrar visita + actualizar contadores (lógica de sellos)
  // Recuperamos stamp_limit del restaurante
  const { data: restaurant, error: restErr } = await supabase
    .from("restaurants")
    .select("stamp_limit")
    .eq("id", restaurantId)
    .single();

  if (restErr || !restaurant) {
    return NextResponse.json({ error: "Restaurante inválido" }, { status: 400 });
  }

  const stampLimit = restaurant.stamp_limit ?? 6;

  let newCurrent = pass.current_stamps + 1;
  const newLifetime = pass.lifetime_stamps + 1;
  let newRewards = pass.reward_unlocked_count;

  let unlocked = false;
  if (newCurrent >= stampLimit) {
    unlocked = true;
    newRewards += 1;
    newCurrent = 0;
  }

  const { error: updErr } = await supabase
    .from("passes")
    .update({
      current_stamps: newCurrent,
      lifetime_stamps: newLifetime,
      reward_unlocked_count: newRewards,
      last_stamped_at: new Date().toISOString(),
    })
    .eq("id", pass.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  const { error: visitErr } = await supabase.from("visits").insert({
    restaurant_id: restaurantId,
    pass_id: pass.id,
    scanned_by_user_id: userData.user.id,
  });

  if (visitErr) {
    return NextResponse.json({ error: visitErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    unlocked,
    current_stamps: newCurrent,
    lifetime_stamps: newLifetime,
    reward_unlocked_count: newRewards,
  });
}
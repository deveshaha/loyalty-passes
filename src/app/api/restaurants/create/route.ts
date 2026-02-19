import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim();
  const stampLimit = Number(body?.stampLimit ?? 6);

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Nombre y slug son obligatorios." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("create_restaurant_for_owner", {
    p_slug: slug,
    p_name: name,
    p_stamp_limit: stampLimit,
    p_branding: body?.branding ?? {},
  });

  if (error) {
    // Mensajes útiles según tu RPC
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, restaurantId: data });
}
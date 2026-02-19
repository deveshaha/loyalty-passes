import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  const supabaseAdmin = createSupabaseAdminClient();

  const body = await req.json().catch(() => ({}));

  const slug = String(body?.slug ?? "").trim();
  const fullName = String(body?.fullName ?? "").trim();
  const email = normalizeEmail(String(body?.email ?? ""));
  const birthdate = body?.birthdate ? String(body.birthdate) : null;

  if (!slug || !fullName || !email) {
    return NextResponse.json(
      { error: "slug, fullName y email son obligatorios." },
      { status: 400 }
    );
  }

  // 1) Buscar restaurante por slug
  const { data: restaurant, error: restErr } = await supabaseAdmin
    .from("restaurants")
    .select("id, slug, name, stamp_limit")
    .eq("slug", slug)
    .single();

  if (restErr || !restaurant) {
    return NextResponse.json({ error: "Restaurante no encontrado." }, { status: 404 });
  }

  // 2) Upsert customer (por unique restaurant_id + email)
  const { data: customer, error: custErr } = await supabaseAdmin
    .from("customers")
    .upsert(
      {
        restaurant_id: restaurant.id,
        full_name: fullName,
        email,
        birthdate,
        deleted_at: null,
      },
      { onConflict: "restaurant_id,email" }
    )
    .select("id, restaurant_id, email")
    .single();

  if (custErr || !customer) {
    return NextResponse.json(
      { error: custErr?.message || "Error creando cliente." },
      { status: 500 }
    );
  }

  // 3) Buscar pass existente para (restaurant, customer)
  const { data: existingPass, error: passFindErr } = await supabaseAdmin
    .from("passes")
    .select("id, serial_number")
    .eq("restaurant_id", restaurant.id)
    .eq("customer_id", customer.id)
    .single();

  // Si existe, devolvemos URL
  if (!passFindErr && existingPass) {
    return NextResponse.json({
      ok: true,
      passUrl: `/p/${existingPass.serial_number}`,
      restaurantName: restaurant.name,
    });
  }

  // 4) Crear pass nuevo
  const serial = crypto.randomUUID(); // serial público
  const authToken = crypto.randomBytes(16).toString("hex"); // secreto (luego útil para Wallet)

  const { data: newPass, error: passCreateErr } = await supabaseAdmin
    .from("passes")
    .insert({
      restaurant_id: restaurant.id,
      customer_id: customer.id,
      serial_number: serial,
      auth_token: authToken,
      current_stamps: 0,
      lifetime_stamps: 0,
      reward_unlocked_count: 0,
    })
    .select("serial_number")
    .single();

  if (passCreateErr || !newPass) {
    return NextResponse.json(
      { error: passCreateErr?.message || "Error creando pass." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    passUrl: `/p/${newPass.serial_number}`,
    restaurantName: restaurant.name,
  });
}
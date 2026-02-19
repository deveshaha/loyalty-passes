import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(req: Request) {
  const supabase = createSupabaseRouteClient();

  const { email, password, next } = await req.json().catch(() => ({
    email: "",
    password: "",
    next: "/dashboard",
  }));

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y password son obligatorios." },
      { status: 400 }
    );
  }

  const { error } = await (await supabase).auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true, next: next || "/dashboard" });
}
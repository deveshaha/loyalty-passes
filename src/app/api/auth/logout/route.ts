import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST() {
  const supabase = createSupabaseRouteClient();
  await (await supabase).auth.signOut();
  return NextResponse.json({ ok: true });
}
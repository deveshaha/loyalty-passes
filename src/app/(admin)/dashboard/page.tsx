import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const { data: authData } = await (await supabase).auth.getUser();
  const userEmail = authData.user?.email ?? "N/A";

  // RLS debe filtrar solo restaurantes donde el usuario es member
  const { data: restaurants, error } = await (await supabase)
    .from("restaurants")
    .select("id, slug, name, status, stamp_limit, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Usuario: {userEmail}</p>
        </div>
        <LogoutButton />
        <Link
          href="/dashboard/restaurants/new"
          className="rounded-md bg-black px-4 py-2 text-white text-sm">
          + Crear restaurante
      </Link>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Mis restaurantes</h2>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Error cargando restaurantes: {error.message}
          </div>
        )}

        {!error && (restaurants?.length ?? 0) === 0 && (
          <div className="rounded-md border p-3 text-sm text-gray-700">
            No tienes restaurantes asignados todavía.
          </div>
        )}

        {(restaurants ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-gray-600">
                  slug: <span className="font-mono">{r.slug}</span> · estado:{" "}
                  {r.status} · sellos: {r.stamp_limit}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(r.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
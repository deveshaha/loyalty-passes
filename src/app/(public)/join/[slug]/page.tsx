import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import JoinForm from "./join-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("slug, name, stamp_limit")
    .eq("slug", slug)
    .single();

  if (!restaurant) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Restaurante no encontrado</h1>
        <p className="mt-2 text-sm text-gray-600">
          El QR puede estar mal o el restaurante no está activo.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Regístrate para obtener tu pass de prueba (sellos: {restaurant.stamp_limit})
          </p>
        </div>

        <JoinForm slug={restaurant.slug} />
      </div>
    </main>
  );
}
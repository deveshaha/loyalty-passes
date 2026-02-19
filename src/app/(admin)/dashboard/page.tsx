import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await (await supabase).auth.getUser();

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Usuario: {data.user?.email ?? "N/A"}
      </p>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}
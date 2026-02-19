"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD") // quita acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "") // solo letras, números, espacios, guiones
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewRestaurantPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const generatedSlug = useMemo(() => slugify(name), [name]);

  const [slug, setSlug] = useState("");
  const effectiveSlug = slug.trim() ? slugify(slug) : generatedSlug;

  const [stampLimit, setStampLimit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/restaurants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: effectiveSlug,
          stampLimit,
          branding: {},
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error || "No se pudo crear el restaurante.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Crear restaurante</h1>
        <p className="mt-1 text-sm text-gray-600">
          Se generará un slug automáticamente, puedes editarlo si quieres.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nombre</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de tu restaurante"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Slug</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 font-mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={generatedSlug || "se-genera-automatico"}
          />
          <p className="mt-1 text-xs text-gray-500">
            URL final: <span className="font-mono">/join/{effectiveSlug || "..."}</span>
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Sellos necesarios</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            type="number"
            min={1}
            max={50}
            value={stampLimit}
            onChange={(e) => setStampLimit(Number(e.target.value))}
          />
        </div>

        {errorMsg && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
            type="submit"
            disabled={loading || !name || !effectiveSlug}
          >
            {loading ? "Creando..." : "Crear"}
          </button>

          <button
            className="rounded-md border px-4 py-2 text-sm"
            type="button"
            onClick={() => router.push("/dashboard")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}
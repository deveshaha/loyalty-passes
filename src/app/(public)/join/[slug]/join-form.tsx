"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinForm({ slug }: { slug: string }) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState(""); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fullName, email, birthdate: birthdate || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error || "No se pudo registrar.");
        return;
      }

      router.push(data.passUrl);
      router.refresh();
    } catch {
      setErrorMsg("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tu nombre"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Fecha de nacimiento (opcional)</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
      </div>

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Registrando..." : "Crear mi pass"}
      </button>
    </form>
  );
}
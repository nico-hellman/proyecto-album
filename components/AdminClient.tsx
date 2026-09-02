"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, Layers, LayoutGrid, Loader2, LogOut, Sparkles, Users, ArrowLeftRight } from "lucide-react";
import Brand from "./Brand";
import ProgressBar from "./ProgressBar";
import type { AdminOverview } from "@/lib/album";

export default function AdminClient({
  overview,
  adminName,
}: {
  overview: AdminOverview;
  adminName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null); // "all" | userId
  const [toast, setToast] = useState<string | null>(null);

  const totalCards = overview.users.reduce((a, u) => a + u.totalCards, 0);

  async function distribute(userId?: string) {
    const key = userId ?? "all";
    setBusy(key);
    setToast(null);
    try {
      const res = await fetch("/api/admin/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userId ? { userId } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data?.error || "Error al repartir calcomanías.");
      } else if (data.scope === "all") {
        setToast(
          data.usersReached === 0
            ? "No hay usuarios coleccionistas todavía."
            : `🎉 Repartiste ${data.perUser} calcomanías a ${data.usersReached} usuario(s).`
        );
      } else {
        setToast("🎁 Entregaste 5 calcomanías.");
      }
      router.refresh();
    } catch {
      setToast("No se pudo conectar con el servidor.");
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4500);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  }

  const stats = [
    { icon: Users, label: "Coleccionistas", value: overview.totalUsers },
    { icon: Layers, label: "Especies", value: overview.totalStickers },
    { icon: Sparkles, label: "Calcomanías repartidas", value: totalCards },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(6,9,18,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <Brand href="/admin" />
          <div className="flex items-center gap-2">
            <Link href="/trades" className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm">
              <ArrowLeftRight size={15} />
              <span className="hidden sm:inline">Intercambios</span>
            </Link>
            <Link href="/album" className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm">
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Ver álbum</span>
            </Link>
            <button
              onClick={logout}
              className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 py-7">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[rgba(255,207,90,0.12)] px-2.5 py-1 text-xs font-semibold text-[var(--gold)]">
            ADMIN
          </span>
          <span className="text-sm text-[var(--muted)]">{adminName}</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-brand sm:text-3xl">
          Panel de administración
        </h1>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 sm:p-5">
              <s.icon size={18} className="text-[var(--gold)]" />
              <div className="mt-3 text-2xl font-extrabold sm:text-3xl">{s.value}</div>
              <div className="text-xs text-[var(--muted)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Acción principal */}
        <section className="glass-strong mt-6 overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-brand">
                <Gift size={18} className="text-[var(--gold)]" />
                Dar calcomanías
              </h2>
              <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
                Entrega <b className="text-[var(--text)]">5 calcomanías al azar</b> a
                cada usuario coleccionista. Pueden tocar repetidas — eso suma a sus
                “repes”.
              </p>
            </div>
            <button
              onClick={() => distribute()}
              disabled={busy !== null}
              className="btn-gold flex items-center gap-2 px-7 py-3.5 text-sm"
            >
              {busy === "all" ? <Loader2 size={17} className="animate-spin" /> : <Gift size={17} />}
              Dar a todos ({overview.totalUsers})
            </button>
          </div>
        </section>

        {/* Usuarios */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Usuarios
          </h2>

          {overview.users.length === 0 ? (
            <div className="glass rounded-2xl px-4 py-6 text-center text-sm text-[var(--muted)]">
              Aún no hay usuarios registrados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {overview.users.map((u) => (
                <div
                  key={u.id}
                  className="glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgba(255,255,255,0.06)] text-sm font-bold uppercase text-[var(--gold)]">
                      {u.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{u.name}</div>
                      <div className="truncate text-xs text-[var(--muted)]">{u.email}</div>
                    </div>
                  </div>

                  <div className="sm:w-52">
                    <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                      <span>
                        {u.owned}/{overview.totalStickers}
                      </span>
                      <span>
                        {u.completion}%{u.repes > 0 ? ` · ${u.repes} repes` : ""}
                      </span>
                    </div>
                    <ProgressBar value={u.completion} />
                  </div>

                  <button
                    onClick={() => distribute(u.id)}
                    disabled={busy !== null}
                    className="btn-ghost flex items-center justify-center gap-1.5 px-4 py-2 text-sm"
                  >
                    {busy === u.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Gift size={15} />
                    )}
                    Dar 5
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="glass-strong rounded-full px-5 py-3 text-sm font-medium shadow-2xl">
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Brand from "./Brand";

const FIELD =
  "w-full rounded-xl border border-[var(--border)] bg-black/30 px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--gold)] focus:bg-black/40";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Algo salió mal. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      router.push(data?.user?.role === "ADMIN" ? "/admin" : "/album");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex justify-center">
        <Brand />
      </div>

      <div className="glass rounded-3xl p-7 shadow-2xl">
        <h1 className="text-xl font-extrabold tracking-brand">
          {isLogin ? "Inicia sesión" : "Crea tu cuenta"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {isLogin
            ? "Entra para abrir tus calcomanías."
            : "Empieza a coleccionar la fauna chilena."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {!isLogin && (
            <input
              className={FIELD}
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          )}
          <input
            className={FIELD}
            type="email"
            placeholder="correo@ejemplo.cl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className={FIELD}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={6}
            required
          />

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-semibold text-[var(--gold)] hover:underline"
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </Link>
        </p>
      </div>

      {isLogin && (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-black/20 p-3 text-center text-[11px] leading-relaxed text-[var(--muted-2)]">
          <span className="font-semibold text-[var(--muted)]">Cuentas de prueba</span>
          <br />
          Admin: <code className="text-[var(--gold)]">admin@album.cl</code> / admin123
          <br />
          Demo: <code className="text-[var(--gold)]">ana@album.cl</code> / demo1234
        </div>
      )}
    </div>
  );
}

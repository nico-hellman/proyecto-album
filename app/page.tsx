import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Brand from "@/components/Brand";
import StickerCard, { type CardSticker } from "@/components/StickerCard";

const SHOWCASE: { card: CardSticker; rotate: string; hideOnMobile?: boolean }[] = [
  {
    card: { number: 1, name: "Huemul", emoji: "🦌", rarity: "LEGENDARIA", owned: true, quantity: 1 },
    rotate: "-rotate-6",
    hideOnMobile: true,
  },
  {
    card: { number: 4, name: "Monito del monte", emoji: "🐿️", rarity: "EPICA", owned: true, quantity: 2 },
    rotate: "rotate-2",
  },
  {
    card: { number: 8, name: "Cóndor", emoji: "🦅", rarity: "LEGENDARIA", owned: true, quantity: 1 },
    rotate: "-rotate-2",
  },
  {
    card: { number: 18, name: "Pingüino de Humboldt", emoji: "🐧", rarity: "RARA", owned: true, quantity: 1 },
    rotate: "rotate-6",
    hideOnMobile: true,
  },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/album");

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Brand />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost px-4 py-2 text-sm">
            Iniciar sesión
          </Link>
          <Link href="/register" className="btn-gold px-4 py-2 text-sm">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:py-16">
        <div className="animate-fade-up">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-[var(--muted)]">
            🇨🇱 18 especies · 4 rarezas
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-brand sm:text-5xl lg:text-6xl">
            Colecciona la <span className="text-gold">fauna de Chile</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-[var(--muted)] sm:text-lg">
            Abre sobres, completa tu álbum digital y consigue las especies
            legendarias. Del huemul al picaflor de Juan Fernández.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/register" className="btn-gold px-6 py-3 text-sm">
              Empezar a coleccionar
            </Link>
            <Link href="/login" className="btn-ghost px-6 py-3 text-sm">
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mt-10 flex gap-6 text-sm text-[var(--muted)]">
            <div>
              <div className="text-2xl font-bold text-[var(--text)]">18</div>
              especies
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text)]">5</div>
              por sobre
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text)]">4</div>
              categorías
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {SHOWCASE.map((item, i) => (
            <div
              key={i}
              className={`w-32 sm:w-40 ${item.rotate} ${
                item.hideOnMobile ? "hidden sm:block" : ""
              }`}
            >
              <StickerCard s={item.card} />
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 py-6 text-center text-xs text-[var(--muted-2)]">
        Un proyecto de WB Studios · Pronto también en Flutter
      </footer>
    </main>
  );
}

"use client";

import { useState } from "react";
import { rarityMeta } from "@/lib/album";

export type RevealCard = {
  number: number;
  name: string;
  emoji: string;
  rarity: string;
  quantity: number;
};

type Phase = "closed" | "opening" | "revealed";

export default function PackOpening({
  cards,
  onClose,
}: {
  cards: RevealCard[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("closed");

  const open = () => {
    setPhase("opening");
    setTimeout(() => setPhase("revealed"), 750);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(3,6,12,0.84)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="reveal-rays pointer-events-none absolute inset-0 opacity-40" />

      {phase !== "revealed" ? (
        <div className="relative text-center">
          <p className="mb-1 tracking-wide text-[var(--muted)]">Tienes</p>
          <h2 className="mb-7 text-3xl font-extrabold tracking-brand text-gold sm:text-4xl">
            {cards.length} calcomanía{cards.length !== 1 ? "s" : ""} nueva
            {cards.length !== 1 ? "s" : ""}
          </h2>

          <button
            onClick={open}
            disabled={phase === "opening"}
            className="group relative mx-auto block"
            aria-label="Abrir sobre"
          >
            <div
              className={`relative grid h-60 w-44 place-items-center overflow-hidden rounded-2xl text-7xl ${
                phase === "closed" ? "animate-float" : ""
              }`}
              style={{
                background: "linear-gradient(160deg,#1c2742,#0a1020)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 30px 80px -28px rgba(255,207,90,0.55)",
              }}
            >
              <span className={phase === "opening" ? "animate-ping" : ""}>📦</span>
              {phase === "opening" && (
                <span
                  className="absolute inset-0 rounded-2xl bg-white"
                  style={{ animation: "burst 0.7s ease-out forwards" }}
                />
              )}
            </div>
            <span className="btn-gold mt-6 inline-block px-7 py-3 text-sm">
              {phase === "opening" ? "Abriendo…" : "Abrir sobre"}
            </span>
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-3xl text-center">
          <h2 className="mb-1 text-2xl font-extrabold tracking-brand text-gold sm:text-3xl">
            ¡Mira lo que conseguiste!
          </h2>
          <p className="mb-6 text-sm text-[var(--muted)]">Se agregaron a tu álbum</p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {cards.map((c, i) => {
              const r = rarityMeta(c.rarity);
              const holo = c.rarity === "EPICA" || c.rarity === "LEGENDARIA";
              const repe = c.quantity > 1;
              return (
                <div
                  key={`${c.number}-${i}`}
                  className={`sticker animate-pop flex aspect-[3/4] w-28 flex-col p-2 sm:w-32 ${
                    holo ? "holo" : ""
                  }`}
                  style={{
                    background: r.gradient,
                    boxShadow: `0 18px 40px -16px ${r.glow}`,
                    animationDelay: `${i * 0.12}s`,
                  }}
                >
                  <div className="relative z-10 flex justify-between font-mono text-[10px] text-white/70">
                    <span>#{String(c.number).padStart(2, "0")}</span>
                    {repe && (
                      <span className="rounded-full bg-black/45 px-1.5 font-bold text-amber-200">
                        REPE
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 grid flex-1 place-items-center text-4xl">
                    {c.emoji}
                  </div>
                  <div className="relative z-10">
                    <div className="text-[11px] font-semibold leading-tight text-white">
                      {c.name}
                    </div>
                    <div
                      className="text-[9px] font-bold uppercase tracking-wide"
                      style={{ color: r.color }}
                    >
                      {r.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={onClose} className="btn-gold mt-8 px-8 py-3 text-sm">
            ¡Agregar al álbum!
          </button>
        </div>
      )}
    </div>
  );
}

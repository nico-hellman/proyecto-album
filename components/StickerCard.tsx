"use client";

import { rarityMeta } from "@/lib/album";
import { Lock, Sparkles } from "lucide-react";

export type CardSticker = {
  number: number;
  name: string;
  emoji: string;
  rarity: string;
  category?: string;
  description?: string;
  owned: boolean;
  quantity: number;
  isNew?: boolean;
  imageUrl?: string | null;
};

export default function StickerCard({ s, onClick }: { s: CardSticker; onClick?: () => void }) {
  const r = rarityMeta(s.rarity);
  const holo = s.rarity === "EPICA" || s.rarity === "LEGENDARIA";

  if (!s.owned) {
    return (
      <div
        className="sticker sticker-locked aspect-[3/4] flex flex-col p-3 select-none"
        title="Aún no la tienes"
      >
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted-2)]">
          <span>#{String(s.number).padStart(2, "0")}</span>
          <Lock size={13} />
        </div>
        <div className="flex-1 grid place-items-center">
          <span className="text-6xl opacity-[0.13] blur-[2px] grayscale">{s.emoji}</span>
        </div>
        <div className="text-center text-[11px] font-medium tracking-wide text-[var(--muted-2)]">
          Por descubrir
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`sticker sticker-owned sticker-sheen aspect-[3/4] flex flex-col p-3 ${holo ? "holo" : ""} ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: r.gradient,
        boxShadow: `0 18px 40px -18px ${r.glow}, inset 0 0 0 1px rgba(255,255,255,0.09)`,
      }}
      title={s.description}
    >
      <div className="relative z-10 flex items-start justify-between">
        <span className="font-mono text-[11px] text-white/70">
          #{String(s.number).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1">
          {s.isNew && (
            <span className="badge-new rounded-full px-2 py-0.5 text-[10px] font-bold leading-none">
              NUEVA
            </span>
          )}
          {s.quantity > 1 && (
            <span className="rounded-full border border-white/20 bg-black/35 px-2 py-0.5 text-[10px] font-bold leading-none text-white">
              ×{s.quantity}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 grid place-items-center">
        <span className="animate-float text-[64px] leading-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]">
          {s.emoji}
        </span>
      </div>

      <div className="relative z-10 text-center">
        <div className="text-sm font-semibold leading-tight tracking-brand text-white">
          {s.name}
        </div>
        <div
          className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "#1a1205", background: r.color }}
        >
          {s.rarity === "LEGENDARIA" && <Sparkles size={10} />}
          {r.label}
        </div>
      </div>
    </div>
  );
}

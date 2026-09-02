"use client";

import { X, Sparkles, Bookmark, RefreshCw } from "lucide-react";
import { rarityMeta, categoryMeta, type AlbumSticker } from "@/lib/album";
import { useEffect, useState } from "react";

const RECYCLE_POINTS: Record<string, number> = {
  COMUN: 10,
  RARA: 25,
  EPICA: 60,
  LEGENDARIA: 150,
};

export default function StickerModal({
  sticker,
  onClose,
  onRecycleSuccess,
}: {
  sticker: AlbumSticker;
  onClose: () => void;
  onRecycleSuccess?: (stickerId: string, newQuantity: number, newPoints: number) => void;
}) {
  const r = rarityMeta(sticker.rarity);
  const cat = categoryMeta(sticker.category);
  const holo = sticker.rarity === "EPICA" || sticker.rarity === "LEGENDARIA";
  
  const [isRecycling, setIsRecycling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecycle = async () => {
    if (isRecycling) return;
    setIsRecycling(true);
    setError(null);
    try {
      const res = await fetch("/api/stickers/recycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickerId: sticker.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al reciclar.");
      }
      if (onRecycleSuccess) {
        onRecycleSuccess(sticker.id, data.newQuantity, data.newPoints);
      }
    } catch (err: any) {
      setError(err.message || "Error al reciclar la calcomanía.");
    } finally {
      setIsRecycling(false);
    }
  };

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass relative overflow-hidden rounded-3xl w-full max-w-2xl bg-[#0b1322]/95 border border-[var(--border-strong)] shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer click dentro del panel
      >
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full border border-white/10 bg-black/40 p-2 text-white/70 hover:bg-black/60 hover:text-white transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[220px_1fr] items-center">
          {/* Lado izquierdo: Visualización gigante de la carta */}
          <div className="flex justify-center">
            <div
              className={`sticker sticker-sheen w-full max-w-[220px] aspect-[3/4] flex flex-col p-4 select-none ${
                holo ? "holo" : ""
              }`}
              style={{
                background: r.gradient,
                boxShadow: `0 20px 50px -15px ${r.glow}, inset 0 0 0 1px rgba(255,255,255,0.12)`,
              }}
            >
              <div className="flex justify-between font-mono text-[12px] text-white/80">
                <span>#{String(sticker.number).padStart(2, "0")}</span>
                {sticker.quantity > 1 && (
                  <span className="rounded-full border border-white/20 bg-black/35 px-2 py-0.5 text-[10px] font-bold leading-none text-white">
                    ×{sticker.quantity}
                  </span>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center py-2.5">
                {sticker.imageUrl ? (
                  <div className="w-full aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 shadow-inner relative bg-black/40">
                    <img
                      src={sticker.imageUrl}
                      alt={sticker.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ) : (
                  <span className="animate-float text-7xl leading-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
                    {sticker.emoji}
                  </span>
                )}
              </div>
              <div className="text-center">
                <div className="text-base font-bold tracking-brand text-white">
                  {sticker.name}
                </div>
                <div
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#1a1205", background: r.color }}
                >
                  {sticker.rarity === "LEGENDARIA" && <Sparkles size={10} />}
                  {r.label}
                </div>
              </div>
            </div>
          </div>

          {/* Lado derecho: Detalles del animal */}
          <div className="flex flex-col h-full justify-center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-[var(--muted)]">
                Nº {String(sticker.number).padStart(2, "0")}
              </span>
              <span className="text-[var(--muted)]">•</span>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: r.color, backgroundColor: `${r.color}15` }}
              >
                {r.label}
              </span>
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-brand text-white">
              {sticker.name}
            </h2>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-lg">{cat.emoji}</span>
              <span className="text-sm font-semibold text-[var(--muted)]">
                {cat.label}
              </span>
            </div>

            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
                Descripción
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {sticker.description}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-2)]">
              <span className="flex items-center gap-1">
                <Bookmark size={13} />
                Obtenida: {sticker.quantity === 1 ? "1 vez" : `${sticker.quantity} veces`}
              </span>
              {sticker.quantity > 1 && (
                <span className="rounded-full bg-[rgba(255,207,90,0.12)] px-2 py-0.5 text-[var(--gold)] font-medium">
                  {sticker.quantity - 1} repetida{sticker.quantity > 2 ? "s" : ""}
                </span>
              )}
            </div>

            {sticker.quantity >= 2 && (
              <button
                onClick={handleRecycle}
                disabled={isRecycling}
                className="mt-5 btn-gold w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecycling ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Reciclando...
                  </span>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Reciclar 1 repetida (+{RECYCLE_POINTS[sticker.rarity] ?? 10} pts)
                  </>
                )}
              </button>
            )}

            {error && (
              <p className="mt-2 text-xs text-red-400 text-center font-medium animate-fade-in">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

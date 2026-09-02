"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, LogOut, Shield, ArrowLeftRight } from "lucide-react";
import Header from "./Header";
import ProgressBar from "./ProgressBar";
import StickerCard from "./StickerCard";
import PackOpening, { type RevealCard } from "./PackOpening";
import StickerModal from "./StickerModal";
import { CATEGORIES, RARITY_ORDER, rarityMeta, ACHIEVEMENTS, type Album, type AlbumSticker, type AchievementMeta } from "@/lib/album";

export default function AlbumClient({
  album,
  userName,
  isAdmin,
}: {
  album: Album;
  userName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();

  // Local state to keep track of album data for instant feedback
  const [currentAlbum, setCurrentAlbum] = useState<Album>(album);

  useEffect(() => {
    setCurrentAlbum(album);
  }, [album]);

  const { stats } = currentAlbum;

  const newCards: RevealCard[] = useMemo(
    () =>
      currentAlbum.stickers
        .filter((s) => s.isNew && s.owned)
        .map((s) => ({
          number: s.number,
          name: s.name,
          emoji: s.emoji,
          rarity: s.rarity,
          quantity: s.quantity,
        })),
    [currentAlbum]
  );

  const [showReveal, setShowReveal] = useState(newCards.length > 0 && (!currentAlbum.newlyUnlocked || currentAlbum.newlyUnlocked.length === 0));
  const [unlockedCelebration, setUnlockedCelebration] = useState<AchievementMeta[]>(currentAlbum.newlyUnlocked || []);
  const [activeTab, setActiveTab] = useState<"album" | "logros" | "store">("album");
  const [activeSticker, setActiveSticker] = useState<AlbumSticker | null>(null);

  // Point Store states
  const [buyingPacks, setBuyingPacks] = useState<number | null>(null);
  const [revealCards, setRevealCards] = useState<RevealCard[]>([]);

  const rarityStats = useMemo(
    () =>
      RARITY_ORDER.map((rk) => {
        const all = currentAlbum.stickers.filter((s) => s.rarity === rk);
        return {
          key: rk,
          meta: rarityMeta(rk),
          owned: all.filter((s) => s.owned).length,
          total: all.length,
        };
      }),
    [currentAlbum]
  );

  async function closeReveal() {
    setShowReveal(false);
    try {
      await fetch("/api/stickers/seen", { method: "POST" });
    } catch {}
    router.refresh();
  }

  function closeCelebration() {
    setUnlockedCelebration([]);
    if (newCards.length > 0) {
      setShowReveal(true);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  }

  async function handleBuyPacks(count: number) {
    if (buyingPacks !== null) return;
    setBuyingPacks(count);
    try {
      const res = await fetch("/api/store/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packsCount: count }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al realizar la compra.");
        return;
      }

      // Update local points before starting animation to keep it seamless
      setCurrentAlbum(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          points: data.newPoints,
        }
      }));

      // Set the reveal cards to trigger the opening animation
      setRevealCards(
        data.cards.map((c: any) => ({
          number: c.number,
          name: c.name,
          emoji: c.emoji,
          rarity: c.rarity,
          quantity: c.quantity,
        }))
      );
    } catch (err: any) {
      alert("Error de conexión al realizar la compra.");
    } finally {
      setBuyingPacks(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <Header pointsOverride={stats.points} />

      <div className="mx-auto w-full max-w-6xl px-5 py-7">
        <section className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-brand sm:text-3xl">Mi álbum</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Fauna de Chile · colección oficial
              </p>

              <div className="mt-5 flex items-end gap-3">
                <span className="text-5xl font-extrabold leading-none text-gold">
                  {stats.completion}%
                </span>
                <span className="mb-1 text-sm text-[var(--muted)]">completado</span>
              </div>

              <div className="mt-3 max-w-md">
                <ProgressBar value={stats.completion} />
                <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
                  <span>
                    {stats.owned} de {stats.total} especies
                  </span>
                  {stats.repes > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Copy size={12} /> {stats.repes} repetidas
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-1.5">
              {rarityStats.map((rs) => (
                <div
                  key={rs.key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2"
                >
                  <span
                    className="flex items-center gap-2 text-xs font-semibold"
                    style={{ color: rs.meta.color }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: rs.meta.color }}
                    />
                    {rs.meta.label}
                  </span>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {rs.owned}/{rs.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Selector de pestañas */}
        <div className="mt-8 flex gap-4 border-b border-[var(--border)] pb-px text-sm">
          <button
            onClick={() => setActiveTab("album")}
            className={`pb-3 font-semibold transition cursor-pointer ${
              activeTab === "album"
                ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Colección
          </button>
          <button
            onClick={() => setActiveTab("logros")}
            className={`pb-3 font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "logros"
                ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Logros y Misiones
            {currentAlbum.achievements?.filter((a) => a.unlocked).length ? (
              <span className="rounded-full bg-[rgba(255,207,90,0.12)] px-2 py-0.5 text-[10px] font-bold text-[var(--gold)]">
                {currentAlbum.achievements.filter((a) => a.unlocked).length}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab("store")}
            className={`pb-3 font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "store"
                ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Tienda
          </button>
        </div>

        {/* Panel de Calcomanías (Álbum) */}
        {activeTab === "album" && (
          <>
            {stats.owned === 0 && (
              <div className="mt-6 rounded-2xl border border-[var(--gold)]/25 bg-[rgba(255,207,90,0.06)] px-4 py-3 text-sm text-[var(--muted)]">
                Tu álbum está vacío por ahora. Cuando se repartan sobres, tus
                calcomanías aparecerán aquí. ✨
              </div>
            )}

            {CATEGORIES.map((cat) => {
              const items = currentAlbum.stickers
                .filter((s) => s.category === cat.key)
                .sort((a, b) => a.number - b.number);
              if (items.length === 0) return null;
              const owned = items.filter((s) => s.owned).length;
              return (
                <section key={cat.key} className="mt-9">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <h2 className="text-lg font-bold tracking-brand">{cat.label}</h2>
                    <span className="rounded-full border border-[var(--border)] bg-black/20 px-2.5 py-0.5 text-xs text-[var(--muted)]">
                      {owned}/{items.length}
                    </span>
                    <div className="ml-2 hidden h-px flex-1 bg-[var(--border)] sm:block" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                    {items.map((s) => (
                      <StickerCard key={s.id} s={s} onClick={() => setActiveSticker(s)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        {/* Panel de Logros */}
        {activeTab === "logros" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ACHIEVEMENTS.map((a) => {
              const userAch = currentAlbum.achievements?.find((ua) => ua.id === a.id);
              const isUnlocked = !!userAch?.unlocked;
              const unlockedAt = userAch?.unlockedAt
                ? new Date(userAch.unlockedAt).toLocaleDateString("es-CL")
                : null;

              return (
                <div
                  key={a.id}
                  className={`glass relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                    isUnlocked
                      ? "border-[var(--gold)]/30 bg-black/25 shadow-[0_10px_25px_-10px_rgba(255,207,90,0.15)]"
                      : "border-[var(--border)] bg-black/10 opacity-60"
                  }`}
                >
                  {isUnlocked && (
                    <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden pointer-events-none">
                      <div className="absolute top-2 right-[-24px] bg-gradient-to-r from-amber-400 to-yellow-500 text-[8px] font-bold text-[#1a1205] uppercase py-1 px-8 rotate-45 text-center shadow-sm">
                        Listo
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className={`text-4xl block mb-3 ${isUnlocked ? "" : "grayscale opacity-50"}`}>
                      {a.emoji}
                    </span>
                    <h3 className={`font-bold text-sm tracking-brand ${isUnlocked ? "text-white" : "text-[var(--muted)]"}`}>
                      {a.title}
                    </h3>
                    <p className="text-xs text-[var(--muted-2)] mt-1.5 leading-relaxed">
                      {a.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-[var(--muted-2)]">{a.rewardText}</span>
                    {isUnlocked && unlockedAt ? (
                      <span className="text-[var(--gold)] font-medium">unlockedAt {unlockedAt}</span>
                    ) : (
                      <span className="text-red-400/80">Bloqueado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Panel de Tienda */}
        {activeTab === "store" && (
          <div className="mt-8 space-y-8 animate-fade-in">
            {/* Header info */}
            <div className="glass rounded-3xl p-6 border border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold tracking-brand text-amber-200 flex items-center gap-2">
                  <span>🪙</span> Centro de Canje de Sobres
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)] max-w-xl">
                  Recicla tus calcomanías repetidas, completa intercambios y desbloquea logros para acumular puntos. ¡Canjéalos por sobres adicionales aquí!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-xl border border-white/5 bg-black/35 px-3 py-1.5 text-[var(--muted)]">
                  🔄 Reciclar: <b className="text-white">10-150 pts</b>
                </span>
                <span className="rounded-xl border border-white/5 bg-black/35 px-3 py-1.5 text-[var(--muted)]">
                  🤝 Trueque: <b className="text-white">15 pts</b>
                </span>
                <span className="rounded-xl border border-white/5 bg-black/35 px-3 py-1.5 text-[var(--muted)]">
                  🏆 Logros: <b className="text-white">100 pts</b>
                </span>
              </div>
            </div>

            {/* Store Grid */}
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { count: 1, stickers: 5, cost: 100, discount: null, label: "Sobre Inicial", tag: "Casual" },
                { count: 3, stickers: 15, cost: 270, discount: "10% AHORRO", label: "Pack del Explorador", tag: "Popular" },
                { count: 5, stickers: 25, cost: 420, discount: "16% AHORRO", label: "Caja de Reservas", tag: "Mejor Valor" },
              ].map((pack) => {
                const canAfford = stats.points >= pack.cost;
                const isBuying = buyingPacks === pack.count;
                
                return (
                  <div
                    key={pack.count}
                    className={`glass relative overflow-hidden rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 ${
                      canAfford
                        ? "border-amber-500/20 hover:border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-black/30 shadow-[0_10px_30px_-15px_rgba(245,158,11,0.1)] hover:shadow-[0_15px_40px_-10px_rgba(245,158,11,0.2)] hover:-translate-y-1"
                        : "border-[var(--border)] bg-black/10 opacity-70"
                    }`}
                  >
                    {/* Tags */}
                    {pack.discount && (
                      <div className="absolute top-3 right-3 rounded-full bg-amber-500 text-[10px] font-extrabold text-[#1a1205] px-2.5 py-0.5 uppercase tracking-wider">
                        {pack.discount}
                      </div>
                    )}
                    
                    <div>
                      <span className="inline-block rounded-lg bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--muted-2)] uppercase tracking-wider">
                        {pack.tag}
                      </span>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <h3 className="font-extrabold text-lg text-white">
                          {pack.label}
                        </h3>
                      </div>
                      
                      <p className="mt-1 text-xs text-[var(--muted-2)]">
                        Contiene {pack.stickers} calcomanías aleatorias.
                      </p>

                      {/* Visual pack representation */}
                      <div className="my-6 flex justify-center items-center relative h-28 select-none pointer-events-none">
                        <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent blur-xl" />
                        
                        {/* Render simple card fan/overlapping elements representing packs */}
                        {Array.from({ length: pack.count }).map((_, idx) => {
                          const rotation = (idx - (pack.count - 1) / 2) * 12;
                          const translationX = (idx - (pack.count - 1) / 2) * 15;
                          return (
                            <div
                              key={idx}
                              className="absolute w-16 h-24 rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#f59e0b] to-[#7c4a03] flex flex-col items-center justify-center shadow-lg transition-transform"
                              style={{
                                transform: `translateX(${translationX}px) rotate(${rotation}deg)`,
                                zIndex: idx,
                              }}
                            >
                              <span className="text-2xl animate-float">✉️</span>
                              <span className="mt-1 text-[8px] font-extrabold text-amber-200 uppercase tracking-widest font-mono">
                                PACK
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-baseline justify-between mb-4">
                        <span className="text-xs text-[var(--muted-2)]">Costo:</span>
                        <span className="text-2xl font-black text-amber-400 flex items-center gap-1">
                          🪙 {pack.cost} <span className="text-xs font-normal text-[var(--muted-2)]">pts</span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleBuyPacks(pack.count)}
                        disabled={!canAfford || buyingPacks !== null}
                        className={`w-full py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all cursor-pointer ${
                          canAfford
                            ? "btn-gold"
                            : "bg-white/5 border border-white/10 text-[var(--muted-2)] cursor-not-allowed"
                        }`}
                      >
                        {isBuying ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <span className="h-4 w-4 animate-spin rounded-full border-[#1a1205]/30 border-t-[#1a1205]" />
                            Procesando...
                          </span>
                        ) : canAfford ? (
                          `Canjear ${pack.count} Sobre${pack.count > 1 ? "s" : ""}`
                        ) : (
                          `Faltan ${pack.cost - stats.points} pts`
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {(showReveal || revealCards.length > 0) && (
        <PackOpening
          cards={revealCards.length > 0 ? revealCards : newCards}
          onClose={async () => {
            if (revealCards.length > 0) {
              setRevealCards([]);
              try {
                await fetch("/api/stickers/seen", { method: "POST" });
              } catch {}
              router.refresh();
            } else {
              await closeReveal();
            }
          }}
        />
      )}

      {activeSticker && (
        <StickerModal
          sticker={activeSticker}
          onClose={() => setActiveSticker(null)}
          onRecycleSuccess={(stickerId, newQuantity, newPoints) => {
            setCurrentAlbum(prev => {
              const updatedStickers = prev.stickers.map(s => {
                if (s.id === stickerId) {
                  return { ...s, quantity: newQuantity };
                }
                return s;
              });
              const repes = updatedStickers.reduce((a, o) => a + Math.max(0, o.quantity - 1), 0);
              return {
                ...prev,
                stickers: updatedStickers,
                stats: {
                  ...prev.stats,
                  points: newPoints,
                  repes,
                }
              };
            });
            // Update activeSticker quantity locally so the modal updates instantly
            setActiveSticker(prev => prev ? { ...prev, quantity: newQuantity } : null);
          }}
        />
      )}

      {/* Modal de Celebración de Logros */}
      {unlockedCelebration.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="glass relative overflow-hidden rounded-3xl w-full max-w-md bg-[#0b1322]/95 border border-[var(--gold)]/30 p-6 text-center shadow-2xl animate-scale-up">
            <div className="reveal-rays pointer-events-none absolute inset-0 opacity-20" />
            
            <span className="text-6xl block mb-4 animate-float">🎉</span>
            <h2 className="text-2xl font-extrabold tracking-brand text-[var(--gold)]">
              ¡Logro Desbloqueado!
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Tus habilidades de coleccionista han dado frutos.
            </p>

            <div className="mt-6 space-y-3">
              {unlockedCelebration.map((a) => (
                <div
                  key={a.id}
                  className="glass rounded-2xl p-4 border border-[var(--gold)]/20 bg-black/25 flex items-center gap-3 text-left"
                >
                  <span className="text-3xl shrink-0">{a.emoji}</span>
                  <div>
                    <h3 className="font-bold text-sm text-white">{a.title}</h3>
                    <p className="text-xs text-[var(--muted-2)] mt-0.5 leading-tight">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-200">
              🎁 Recompensa: Se ha añadido {unlockedCelebration.length} sobre{unlockedCelebration.length > 1 ? "s" : ""} gratis a tu cuenta.
            </div>

            <button
              onClick={closeCelebration}
              className="btn-gold mt-6 w-full py-3 text-sm cursor-pointer"
            >
              ¡Abrir sobre de regalo!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

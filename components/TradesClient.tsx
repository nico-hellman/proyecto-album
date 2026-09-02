"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, LayoutGrid, Loader2, LogOut, Shield, PlusCircle, Trash, RefreshCw, AlertCircle } from "lucide-react";
import Header from "./Header";
import { rarityMeta, type AlbumSticker } from "@/lib/album";

type TradeOfferWithDetails = {
  id: string;
  senderId: string;
  receiverId?: string | null;
  offeredStickerId: string;
  requestedStickerId: string;
  status: string;
  createdAt: string;
  sender: { name: string; email: string };
  receiver?: { name: string } | null;
  offeredSticker: { number: number; name: string; emoji: string; rarity: string };
  requestedSticker: { number: number; name: string; emoji: string; rarity: string };
};

export default function TradesClient({
  initialPublicOffers,
  initialMyOffers,
  myStickers,
  allStickers,
  userName,
  isAdmin,
}: {
  initialPublicOffers: TradeOfferWithDetails[];
  initialMyOffers: TradeOfferWithDetails[];
  myStickers: AlbumSticker[];
  allStickers: any[];
  userName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [publicOffers, setPublicOffers] = useState<TradeOfferWithDetails[]>(initialPublicOffers);
  const [myOffers, setMyOffers] = useState<TradeOfferWithDetails[]>(initialMyOffers);

  const directOffers = publicOffers.filter((o) => o.receiverId !== null && o.receiverId !== undefined);
  const generalOffers = publicOffers.filter((o) => o.receiverId === null || o.receiverId === undefined);

  const [offeredId, setOfferedId] = useState("");
  const [requestedId, setRequestedId] = useState("");

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ownedStickers = myStickers.filter((s) => s.owned && s.quantity >= 1);
  const sortedStickers = [...allStickers].sort((a, b) => a.number - b.number);

  async function refreshTrades() {
    try {
      const res = await fetch("/api/trades");
      const data = await res.json();
      if (res.ok) {
        setPublicOffers(data.publicOffers);
        setMyOffers(data.myOffers);
      }
    } catch {}
  }

  async function createOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offeredId || !requestedId) return;
    if (offeredId === requestedId) {
      setError("No puedes ofrecer y buscar la misma calcomanía.");
      return;
    }

    setBusy("create");
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offeredStickerId: offeredId, requestedStickerId: requestedId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la oferta.");
      } else {
        setSuccess("🎉 Oferta publicada en el mercado.");
        setOfferedId("");
        setRequestedId("");
        await refreshTrades();
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setBusy(null);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 4500);
    }
  }

  async function acceptOffer(offerId: string) {
    setBusy(offerId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/trades/${offerId}/accept`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al realizar el intercambio.");
      } else {
        setSuccess("🎉 ¡Intercambio realizado! Revisa tu álbum.");
        await refreshTrades();
        router.refresh();
      }
    } catch {
      setError("No se pudo completar el intercambio.");
    } finally {
      setBusy(null);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 4500);
    }
  }

  async function cancelOffer(offerId: string) {
    setBusy(offerId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/trades/${offerId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al cancelar la oferta.");
      } else {
        setSuccess("Oferta cancelada con éxito.");
        await refreshTrades();
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setBusy(null);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 4500);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col">
      <Header />

      <div className="mx-auto w-full max-w-6xl px-5 py-7 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="glass inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-[var(--muted)]">
              🤝 Intercambio de Calcomanías
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-brand sm:text-3xl">Mercado de Trueques</h1>
          </div>
          <button
            onClick={refreshTrades}
            disabled={busy !== null}
            className="btn-ghost p-2 cursor-pointer"
            title="Actualizar mercado"
          >
            <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-fade-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 animate-fade-in">
            <span>{success}</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Lado Izquierdo: Ofertas en el mercado */}
          <section className="space-y-6">
            {/* 1. Trueques directos dirigidos a ti */}
            {directOffers.length > 0 && (
              <div className="space-y-3 pb-6 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-lg font-bold tracking-brand text-amber-200 flex items-center gap-2">
                    <span className="animate-pulse">✨</span> Trueques directos para ti
                  </h2>
                  <p className="text-xs text-[var(--muted)]">Intercambios privados propuestos directamente para ti.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                  {directOffers.map((offer) => {
                    const offMeta = rarityMeta(offer.offeredSticker.rarity);
                    const reqMeta = rarityMeta(offer.requestedSticker.rarity);
                    
                    const currentUserSticker = myStickers.find(s => s.id === offer.requestedStickerId);
                    const hasRequested = !!currentUserSticker && currentUserSticker.owned && currentUserSticker.quantity >= 1;

                    return (
                      <div
                        key={offer.id}
                        className="glass flex flex-col justify-between rounded-2xl p-4 border border-amber-500/25 bg-amber-500/5 shadow-md relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 h-10 w-10 overflow-hidden pointer-events-none">
                          <div className="absolute top-1.5 right-[-18px] bg-amber-500 text-[6px] font-bold text-[#1a1205] uppercase py-0.5 px-6 rotate-45 text-center shadow-sm">
                            Directo
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] text-[var(--muted-2)] font-mono">
                            <span>De: {offer.sender.name}</span>
                            <span>{new Date(offer.createdAt).toLocaleDateString("es-CL")}</span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            {/* Ofrece */}
                            <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 text-center min-w-0">
                              <span className="text-[10px] text-[var(--muted-2)] uppercase font-bold tracking-wider">Ofrece</span>
                              <span className="text-3xl my-1.5">{offer.offeredSticker.emoji}</span>
                              <span className="text-xs font-bold truncate max-w-full text-white">{offer.offeredSticker.name}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 uppercase" style={{ color: "#1a1205", background: offMeta.color }}>
                                {offMeta.label}
                              </span>
                            </div>

                            <ArrowLeftRight size={16} className="text-[var(--gold)] shrink-0 opacity-80" />

                            {/* Busca */}
                            <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 text-center min-w-0">
                              <span className="text-[10px] text-[var(--muted-2)] uppercase font-bold tracking-wider">Busca</span>
                              <span className="text-3xl my-1.5">{offer.requestedSticker.emoji}</span>
                              <span className="text-xs font-bold truncate max-w-full text-white">{offer.requestedSticker.name}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 uppercase" style={{ color: "#1a1205", background: reqMeta.color }}>
                                {reqMeta.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
                          <span className="text-[10px] text-[var(--muted)]">
                            {hasRequested ? (
                              <span className="text-emerald-400 font-semibold">✓ Tienes lo que busca</span>
                            ) : (
                              <span className="text-red-400">✗ No tienes lo que busca</span>
                            )}
                          </span>
                          
                          <button
                            onClick={() => acceptOffer(offer.id)}
                            disabled={!hasRequested || busy !== null}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              hasRequested
                                ? "btn-gold cursor-pointer"
                                : "border border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                            }`}
                          >
                            {busy === offer.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              "Hacer Trato"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Trueques públicos generales */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold tracking-brand text-white">Mercado general</h2>
                <p className="text-xs text-[var(--muted)]">Trueques públicos abiertos para toda la comunidad.</p>
              </div>

              {generalOffers.length === 0 ? (
                <div className="glass rounded-3xl p-10 text-center text-[var(--muted)]">
                  <ArrowLeftRight size={36} className="mx-auto text-[var(--muted-2)] mb-3 opacity-40" />
                  <p className="text-sm font-medium">No hay ofertas de intercambio públicas en este momento.</p>
                  <p className="text-xs mt-1 text-[var(--muted-2)]">¡Sé el primero en publicar una oferta a la derecha!</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                  {generalOffers.map((offer) => {
                    const offMeta = rarityMeta(offer.offeredSticker.rarity);
                    const reqMeta = rarityMeta(offer.requestedSticker.rarity);
                    
                    const currentUserSticker = myStickers.find(s => s.id === offer.requestedStickerId);
                    const hasRequested = !!currentUserSticker && currentUserSticker.owned && currentUserSticker.quantity >= 1;

                    return (
                      <div
                        key={offer.id}
                        className="glass flex flex-col justify-between rounded-2xl p-4 border border-[var(--border)] bg-black/15 shadow-md"
                      >
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-[var(--muted-2)] font-mono">
                            <span>De: {offer.sender.name}</span>
                            <span>{new Date(offer.createdAt).toLocaleDateString("es-CL")}</span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            {/* Ofrece */}
                            <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 text-center min-w-0">
                              <span className="text-[10px] text-[var(--muted-2)] uppercase font-bold tracking-wider">Ofrece</span>
                              <span className="text-3xl my-1.5">{offer.offeredSticker.emoji}</span>
                              <span className="text-xs font-bold truncate max-w-full text-white">{offer.offeredSticker.name}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 uppercase" style={{ color: "#1a1205", background: offMeta.color }}>
                                {offMeta.label}
                              </span>
                            </div>

                            <ArrowLeftRight size={16} className="text-[var(--gold)] shrink-0 opacity-80" />

                            {/* Busca */}
                            <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 text-center min-w-0">
                              <span className="text-[10px] text-[var(--muted-2)] uppercase font-bold tracking-wider">Busca</span>
                              <span className="text-3xl my-1.5">{offer.requestedSticker.emoji}</span>
                              <span className="text-xs font-bold truncate max-w-full text-white">{offer.requestedSticker.name}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 uppercase" style={{ color: "#1a1205", background: reqMeta.color }}>
                                {reqMeta.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
                          <span className="text-[10px] text-[var(--muted)]">
                            {hasRequested ? (
                              <span className="text-emerald-400 font-semibold">✓ Tienes lo que busca</span>
                            ) : (
                              <span className="text-red-400">✗ No tienes lo que busca</span>
                            )}
                          </span>
                          
                          <button
                            onClick={() => acceptOffer(offer.id)}
                            disabled={!hasRequested || busy !== null}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              hasRequested
                                ? "btn-gold cursor-pointer"
                                : "border border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                            }`}
                          >
                            {busy === offer.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              "Hacer Trato"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mis Ofertas */}
            <div className="pt-6 border-t border-[var(--border)]">
              <h2 className="text-lg font-bold tracking-brand text-white">Mis ofertas pendientes</h2>
              <p className="text-xs text-[var(--muted)]">Ofertas que has publicado y están a la espera de ser aceptadas.</p>
              
              {myOffers.length === 0 ? (
                <p className="text-xs text-[var(--muted-2)] mt-3">No tienes ofertas activas creadas por ti.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {myOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="glass flex items-center justify-between rounded-xl p-3 bg-black/10 text-xs"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-lg shrink-0">{offer.offeredSticker.emoji}</span>
                            <span className="font-semibold text-white truncate max-w-[80px] sm:max-w-[120px]">{offer.offeredSticker.name}</span>
                          </div>
                          <ArrowLeftRight size={12} className="text-[var(--gold)] shrink-0" />
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-lg shrink-0">{offer.requestedSticker.emoji}</span>
                            <span className="font-semibold text-white truncate max-w-[80px] sm:max-w-[120px]">{offer.requestedSticker.name}</span>
                          </div>
                        </div>
                        {offer.receiver && (
                          <span className="text-[9px] text-amber-200">
                            👉 Directo para: <span className="font-bold">{offer.receiver.name}</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => cancelOffer(offer.id)}
                        disabled={busy !== null}
                        className="btn-ghost p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer rounded-lg border-none"
                        title="Cancelar oferta"
                      >
                        {busy === offer.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash size={13} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Lado Derecho: Crear Oferta */}
          <aside>
            <div className="glass rounded-3xl p-5 bg-[#0b1322]/80 border border-[var(--border)]">
              <h2 className="text-md font-bold tracking-brand text-white flex items-center gap-2">
                <PlusCircle size={16} className="text-[var(--gold)]" />
                Publicar trueque
              </h2>
              <p className="text-[11px] text-[var(--muted)] mt-1">Ofrece un sticker que tengas (se recomiendan repetidas) y busca uno que te falte.</p>

              <form onSubmit={createOffer} className="mt-4 space-y-4">
                {/* Seleccionar sticker a ofrecer */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)] block mb-1.5">
                    ¿Qué sticker ofreces?
                  </label>
                  {ownedStickers.length === 0 ? (
                    <p className="text-xs text-amber-200/70 bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5">
                      No tienes stickers en tu álbum para ofrecer. ¡Abre sobres primero!
                    </p>
                  ) : (
                    <select
                      className="w-full rounded-xl border border-[var(--border)] bg-black/35 px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--gold)] focus:bg-black/50 transition cursor-pointer"
                      value={offeredId}
                      onChange={(e) => setOfferedId(e.target.value)}
                      required
                    >
                      <option value="" disabled className="bg-[#0b1322] text-[var(--muted)]">-- Selecciona uno --</option>
                      {ownedStickers.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0b1322]">
                          {s.emoji} {s.name} ({s.quantity > 1 ? `x${s.quantity} repes` : "único"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Seleccionar sticker a buscar */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)] block mb-1.5">
                    ¿Qué sticker buscas?
                  </label>
                  <select
                    className="w-full rounded-xl border border-[var(--border)] bg-black/35 px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--gold)] focus:bg-black/50 transition cursor-pointer"
                    value={requestedId}
                    onChange={(e) => setRequestedId(e.target.value)}
                    required
                  >
                    <option value="" disabled className="bg-[#0b1322] text-[var(--muted)]">-- Selecciona uno --</option>
                    {sortedStickers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0b1322]">
                        #{String(s.number).padStart(2, "0")} {s.emoji} {s.name} ({s.rarity})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={busy !== null || !offeredId || !requestedId}
                  className="btn-gold w-full flex items-center justify-center gap-1.5 py-2.5 text-xs cursor-pointer"
                >
                  {busy === "create" ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    "Publicar en Mercado"
                  )}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

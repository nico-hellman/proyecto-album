"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Calendar, Trophy, Landmark, ArrowLeftRight, CheckCircle2, 
  HelpCircle, AlertCircle, Sparkles, Loader2, Copy 
} from "lucide-react";
import Header from "./Header";
import ProgressBar from "./ProgressBar";
import { ACHIEVEMENTS, rarityMeta } from "@/lib/album";

type ProfileSticker = {
  id: string;
  number: number;
  name: string;
  emoji: string;
  rarity: string;
  quantity: number;
};

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  points: number;
  createdAt: string;
  achievements: { id: string; achievementId: string; unlockedAt: string }[];
  stickers: ProfileSticker[];
};

type ProfileClientProps = {
  profileUser: ProfileUser;
  currentUserStickers: ProfileSticker[];
  currentUserId: string;
  stats: {
    distinctOwned: number;
    totalCards: number;
    totalStickersCount: number;
    completionPercent: number;
  };
};

export default function ProfileClient({
  profileUser,
  currentUserStickers,
  currentUserId,
  stats,
}: ProfileClientProps) {
  const router = useRouter();

  const [offeredId, setOfferedId] = useState("");
  const [requestedId, setRequestedId] = useState("");
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwnProfile = profileUser.id === currentUserId;

  // Handle direct trade proposal
  async function handleProposeTrade(e: React.FormEvent) {
    e.preventDefault();
    if (!offeredId || !requestedId) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredStickerId: offeredId,
          requestedStickerId: requestedId,
          receiverId: profileUser.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al proponer el trueque.");
      } else {
        setSuccess(`🎉 ¡Trueque propuesto con éxito a ${profileUser.name}!`);
        setOfferedId("");
        setRequestedId("");
        router.refresh();
      }
    } catch {
      setError("Error de red al proponer el trueque.");
    } finally {
      setBusy(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  }

  const joinDate = new Date(profileUser.createdAt).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="flex flex-1 flex-col">
      <Header />

      <div className="mx-auto w-full max-w-6xl px-5 py-7 flex-1">
        
        {/* Banner de Mensajes */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-300 animate-fade-in">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-300 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[340px_1fr]">
          
          {/* Columna Izquierda: Información de Perfil & Widget de Trueque */}
          <div className="space-y-6">
            
            {/* Tarjeta de Información General */}
            <section className="glass rounded-3xl p-6 border border-[var(--border)] bg-gradient-to-b from-[#0b1322] to-black/30">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-200 border border-amber-500/25 mb-4 shadow-inner">
                  <User size={32} />
                </div>
                
                <h1 className="text-xl font-extrabold text-white tracking-brand">
                  {profileUser.name}
                </h1>
                <p className="text-xs text-[var(--muted)] mt-1 truncate max-w-full">
                  {profileUser.email}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted-2)]">
                  <Calendar size={13} />
                  <span>Se unió el {joinDate}</span>
                </div>

                <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-sm font-semibold text-amber-200">
                  <span className="text-lg">🪙</span>
                  <span>Puntos acumulados:</span>
                  <b className="text-amber-400 font-extrabold">{profileUser.points} pts</b>
                </div>
              </div>

              {/* Estadísticas de Progreso */}
              <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
                <div>
                  <div className="flex items-end justify-between text-xs mb-1.5">
                    <span className="font-semibold text-white">Progreso de Álbum</span>
                    <span className="font-black text-amber-400">{stats.completionPercent}%</span>
                  </div>
                  <ProgressBar value={stats.completionPercent} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2">
                  <div className="rounded-xl bg-white/5 border border-white/5 p-2.5">
                    <span className="block text-[var(--muted-2)] font-semibold uppercase text-[9px] tracking-wider">Especies</span>
                    <b className="text-white text-base mt-0.5 block">{stats.distinctOwned} / {stats.totalStickersCount}</b>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/5 p-2.5">
                    <span className="block text-[var(--muted-2)] font-semibold uppercase text-[9px] tracking-wider">Total Copias</span>
                    <b className="text-white text-base mt-0.5 block">{stats.totalCards} <span className="text-[10px] text-[var(--muted)] font-normal">cards</span></b>
                  </div>
                </div>
              </div>
            </section>

            {/* Widget de Trueque Directo */}
            {!isOwnProfile && (
              <section className="glass rounded-3xl p-6 border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-black/30">
                <h2 className="text-sm font-bold tracking-brand text-amber-200 flex items-center gap-2">
                  <ArrowLeftRight size={16} />
                  Proponer Trueque Directo
                </h2>
                <p className="text-[11px] text-[var(--muted)] mt-1.5 leading-relaxed">
                  Proponle un intercambio privado a <b>{profileUser.name}</b>. Ofrece una de tus cartas y solicita una que él posea.
                </p>

                <form onSubmit={handleProposeTrade} className="mt-4 space-y-4">
                  {/* Selector Ofrezco */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted-2)] block mb-1">
                      ¿Qué sticker ofreces?
                    </label>
                    {currentUserStickers.length === 0 ? (
                      <p className="text-xs text-amber-200/60 bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5">
                        No tienes stickers para ofrecer.
                      </p>
                    ) : (
                      <select
                        className="w-full rounded-xl border border-[var(--border)] bg-black/35 px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--gold)] focus:bg-black/50 transition cursor-pointer"
                        value={offeredId}
                        onChange={(e) => setOfferedId(e.target.value)}
                        required
                      >
                        <option value="" disabled className="bg-[#0b1322] text-[var(--muted)]">-- Selecciona tu carta --</option>
                        {currentUserStickers.map((cs) => (
                          <option key={cs.id} value={cs.id} className="bg-[#0b1322]">
                            {cs.emoji} {cs.name} ({cs.rarity}) {cs.quantity > 1 ? `x${cs.quantity}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Selector Solicito */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted-2)] block mb-1">
                      ¿Qué sticker de {profileUser.name} solicitas?
                    </label>
                    {profileUser.stickers.length === 0 ? (
                      <p className="text-xs text-[var(--muted-2)] bg-black/20 border border-white/5 rounded-xl p-2.5">
                        {profileUser.name} no posee stickers en su colección.
                      </p>
                    ) : (
                      <select
                        className="w-full rounded-xl border border-[var(--border)] bg-black/35 px-3 py-2.5 text-xs text-white outline-none focus:border-[var(--gold)] focus:bg-black/50 transition cursor-pointer"
                        value={requestedId}
                        onChange={(e) => setRequestedId(e.target.value)}
                        required
                      >
                        <option value="" disabled className="bg-[#0b1322] text-[var(--muted)]">-- Selecciona su carta --</option>
                        {profileUser.stickers.map((ps) => (
                          <option key={ps.id} value={ps.id} className="bg-[#0b1322]">
                            {ps.emoji} {ps.name} ({ps.rarity}) {ps.quantity > 1 ? `x${ps.quantity}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !offeredId || !requestedId}
                    className="btn-gold w-full flex items-center justify-center gap-1.5 py-2.5 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <>
                        <ArrowLeftRight size={13} />
                        Proponer Trueque
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}
          </div>

          {/* Columna Derecha: Medallas y Logros de este Usuario */}
          <section className="glass rounded-3xl p-6 border border-[var(--border)] bg-gradient-to-b from-[#0b1322] to-black/30 flex flex-col">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5 mb-6">
              <Trophy className="text-[var(--gold)]" size={18} />
              <h2 className="text-lg font-bold tracking-brand text-white">Logros Desbloqueados</h2>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-200 ml-auto">
                {profileUser.achievements.length} / {ACHIEVEMENTS.length}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ACHIEVEMENTS.map((a) => {
                const userAch = profileUser.achievements.find((ua) => ua.achievementId === a.id);
                const isUnlocked = !!userAch;
                const unlockedAtDate = userAch
                  ? new Date(userAch.unlockedAt).toLocaleDateString("es-CL")
                  : null;

                return (
                  <div
                    key={a.id}
                    className={`glass relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between ${
                      isUnlocked
                        ? "border-[var(--gold)]/30 bg-black/25 shadow-[0_8px_20px_-10px_rgba(255,207,90,0.1)]"
                        : "border-[var(--border)] bg-black/10 opacity-40 select-none"
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 h-14 w-14 overflow-hidden pointer-events-none">
                        <div className="absolute top-1 right-[-28px] bg-gradient-to-r from-amber-400 to-yellow-500 text-[6px] font-bold text-[#1a1205] uppercase py-1 px-8 rotate-45 text-center shadow-sm">
                          Listo
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className={`text-3xl block mb-2.5 ${isUnlocked ? "" : "grayscale opacity-30"}`}>
                        {a.emoji}
                      </span>
                      <h3 className={`font-bold text-xs sm:text-sm tracking-brand ${isUnlocked ? "text-white" : "text-[var(--muted)]"}`}>
                        {a.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-[var(--muted-2)] mt-1 leading-relaxed">
                        {a.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-[var(--muted-2)]">
                      <span>{a.rewardText}</span>
                      {isUnlocked && unlockedAtDate ? (
                        <span className="text-[var(--gold)] font-semibold">{unlockedAtDate}</span>
                      ) : (
                        <span className="text-red-400/70">Bloqueado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}

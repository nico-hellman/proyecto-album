"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, LayoutGrid, Shield, LogOut, Search, User, Loader2 } from "lucide-react";
import Brand from "./Brand";

type SearchUser = {
  id: string;
  name: string;
  email: string;
};

export default function Header({ pointsOverride }: { pointsOverride?: number }) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync pointsOverride if passed
  useEffect(() => {
    if (pointsOverride !== undefined) {
      setPoints(pointsOverride);
    }
  }, [pointsOverride]);

  // Fetch current user details on mount
  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.user.id,
            name: data.user.name,
            role: data.user.role,
          });
          if (pointsOverride === undefined) {
            setPoints(data.stats.points);
          }
        }
      } catch {}
    }
    loadMe();
  }, [pointsOverride]);

  // Handle autocomplete user search
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(6,9,18,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Brand & Left Navigation */}
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <Brand href="/album" />
          
          <div className="flex items-center gap-1">
            <Link href="/album" className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm">
              <LayoutGrid size={14} />
              <span className="hidden xs:inline">Álbum</span>
            </Link>
            <Link href="/trades" className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm">
              <ArrowLeftRight size={14} />
              <span className="hidden xs:inline">Trueques</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm">
                <Shield size={14} />
                <span className="hidden xs:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search Bar & User Actions */}
        <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
          
          {/* Autocomplete Search Input */}
          <div className="relative w-full max-w-[220px]" ref={dropdownRef}>
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-black/20 px-2.5 py-1.5 text-xs transition-all focus-within:border-[var(--gold)] focus-within:bg-black/40">
              <Search size={14} className="text-[var(--muted-2)]" />
              <input
                type="text"
                placeholder="Buscar coleccionista..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-transparent text-white outline-none placeholder:text-[var(--muted-2)] text-xs"
              />
              {isSearching && <Loader2 size={12} className="animate-spin text-[var(--gold)]" />}
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchQuery.trim().length > 0 && (
              <div className="glass absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[#0b1322]/95 py-2 shadow-2xl animate-fade-in">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-2.5 text-[11px] text-[var(--muted-2)] text-center">
                    {isSearching ? "Buscando..." : "No se encontraron usuarios"}
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <Link
                      key={u.id}
                      href={`/profile/${u.id}`}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-left text-xs transition"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-200">
                        <User size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{u.name}</p>
                        <p className="text-[9px] text-[var(--muted-2)] truncate">{u.email}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Points & Actions */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
              🪙 {points} pts
            </span>

            {user && (
              <Link
                href={`/profile/${user.id}`}
                className="btn-ghost flex h-8 w-8 items-center justify-center rounded-full p-0"
                title="Mi perfil"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white">
                  <User size={14} />
                </div>
              </Link>
            )}

            <button
              onClick={logout}
              className="btn-ghost p-2 text-[var(--muted)] hover:text-white"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}

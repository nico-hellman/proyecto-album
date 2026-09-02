import Link from "next/link";

export default function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="glass-strong grid h-9 w-9 place-items-center rounded-xl text-lg">
        🏔️
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-extrabold tracking-brand">
          Fauna de <span className="text-gold">Chile</span>
        </span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          Álbum digital
        </span>
      </span>
    </Link>
  );
}

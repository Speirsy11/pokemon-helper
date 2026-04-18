'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTeam } from '@/context/TeamContext';

export function Nav() {
  const pathname = usePathname();
  const { team } = useTeam();

  return (
    <nav className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-4 mb-6">
      <Link href="/" className="font-display text-2xl tracking-[0.18em] text-white hover:text-white/80 transition-colors">
        POKÉ<span className="text-[var(--accent)]">DEX</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className={`px-3 py-1.5 rounded text-sm font-semibold tracking-wide transition-colors ${
            pathname === '/'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          POKÉDEX
        </Link>
        <Link
          href="/team"
          className={`px-3 py-1.5 rounded text-sm font-semibold tracking-wide transition-colors flex items-center gap-2 ${
            pathname === '/team'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          TEAM
          {team.length > 0 && (
            <span
              className="rounded-full text-[0.65rem] font-mono w-5 h-5 flex items-center justify-center text-[#07080f]"
              style={{ background: 'var(--accent)' }}
            >
              {team.length}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}

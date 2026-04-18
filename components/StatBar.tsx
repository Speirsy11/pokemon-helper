'use client';

import { useEffect, useRef } from 'react';
import { STAT_CONFIG } from '@/lib/constants';

interface Props {
  statName: string;
  value: number;
}

export function StatBar({ statName, value }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const cfg = STAT_CONFIG[statName] ?? { label: statName.toUpperCase(), color: '#888' };
  const pct = Math.min((value / 255) * 100, 100);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const t = setTimeout(() => { bar.style.width = `${pct}%`; }, 50);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="grid items-center gap-x-3" style={{ gridTemplateColumns: '56px 36px 1fr' }}>
      <span className="text-right font-mono text-[0.62rem] tracking-wider text-white/40">
        {cfg.label}
      </span>
      <span className="font-mono text-[0.72rem] font-bold text-white/80">{value}</span>
      <div className="h-[6px] rounded-full overflow-hidden bg-white/[0.06]">
        <div
          ref={barRef}
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{ width: 0, background: cfg.color }}
        />
      </div>
    </div>
  );
}

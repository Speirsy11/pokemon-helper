import { TYPE_COLORS } from '@/lib/constants';

interface Props {
  type: string;
  size?: 'sm' | 'md';
}

export function TypeBadge({ type, size = 'md' }: Props) {
  const bg = TYPE_COLORS[type] ?? '#888';
  const cls = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`${cls} rounded font-display tracking-wider text-white inline-block`}
      style={{ background: bg, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
    >
      {type.toUpperCase()}
    </span>
  );
}

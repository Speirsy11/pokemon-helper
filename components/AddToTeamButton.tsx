'use client';

import { useTeam, TeamMember } from '@/context/TeamContext';
import { useRouter } from 'next/navigation';

export function AddToTeamButton({ member }: { member: TeamMember }) {
  const { addMember, removeMember, isInActiveTeam, isFull, activeTeam } = useTeam();
  const router = useRouter();
  const inTeam = isInActiveTeam(member.name);

  if (inTeam) {
    return (
      <button
        onClick={() => removeMember(member.name)}
        className="px-5 py-2 rounded border border-red-500/40 text-red-400 text-sm font-semibold tracking-wide hover:bg-red-500/10 transition-colors"
      >
        Remove from {activeTeam?.name ?? 'Team'}
      </button>
    );
  }

  return (
    <button
      onClick={() => { addMember(member); router.push('/team'); }}
      disabled={isFull}
      className="px-5 py-2 rounded text-sm font-semibold tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: 'var(--accent)', color: '#07080f' }}
      title={isFull ? `${activeTeam?.name ?? 'Active team'} is full (6/6)` : undefined}
    >
      {isFull ? 'Team Full' : `+ Add to ${activeTeam?.name ?? 'Team'}`}
    </button>
  );
}

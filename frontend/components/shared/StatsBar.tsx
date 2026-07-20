'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  valueColor?: string;
  onClick?: () => void;
}

interface StatsBarProps {
  stats: Stat[];
  className?: string;
}

export function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-px rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden', className)}>
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            onClick={stat.onClick}
            className={cn(
              'flex flex-1 flex-col gap-0.5 px-4 py-3 min-w-[100px]',
              i < stats.length - 1 && 'border-r border-white/5',
              stat.onClick && 'cursor-pointer hover:bg-white/5 transition-colors'
            )}
          >
            <span className="text-xs text-zinc-500 flex items-center gap-1.5 whitespace-nowrap">
              {Icon && <Icon className="h-3 w-3" />}
              {stat.label}
            </span>
            <span className={cn('text-sm font-semibold text-white', stat.valueColor)}>
              {stat.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

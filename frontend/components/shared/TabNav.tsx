'use client';

import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabNavProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  sticky?: boolean;
}

export function TabNav({ tabs, active, onChange, className, sticky = true }: TabNavProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 border-b border-white/5 bg-[#0a0a0a]',
        sticky && 'sticky top-0 z-20',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap',
            active === tab.id
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-white/10 text-[10px] font-semibold text-zinc-300 px-1">
              {tab.badge}
            </span>
          )}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

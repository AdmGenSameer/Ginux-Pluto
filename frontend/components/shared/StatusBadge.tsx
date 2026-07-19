import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  running: {
    label: 'Running',
    dot: 'bg-green-400',
    text: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  done: {
    label: 'Done',
    dot: 'bg-green-400',
    text: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  idle: {
    label: 'Idle',
    dot: 'bg-zinc-400',
    text: 'text-zinc-400',
    bg: 'bg-zinc-400/10',
  },
  stopped: {
    label: 'Stopped',
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
  },
  error: {
    label: 'Error',
    dot: 'bg-red-400',
    text: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  building: {
    label: 'Building',
    dot: 'bg-blue-400 animate-pulse',
    text: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  deploying: {
    label: 'Deploying',
    dot: 'bg-yellow-400 animate-pulse',
    text: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  queued: {
    label: 'Queued',
    dot: 'bg-zinc-400',
    text: 'text-zinc-400',
    bg: 'bg-zinc-400/10',
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status?.toLowerCase()] ?? {
    label: status || 'Unknown',
    dot: 'bg-zinc-400',
    text: 'text-zinc-400',
    bg: 'bg-zinc-400/10',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

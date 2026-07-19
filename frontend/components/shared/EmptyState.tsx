import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
        <Icon className="h-6 w-6 text-zinc-500" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-zinc-500">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-500 text-white border-0"
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

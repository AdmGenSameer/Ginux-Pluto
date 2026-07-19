import { cn } from '@/lib/utils';

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl border border-white/5 bg-white/[0.02] p-5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-white/5" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-24 rounded bg-white/5" />
          <div className="h-2 w-16 rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full rounded bg-white/5" />
        <div className="h-2 w-3/4 rounded bg-white/5" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded bg-white/5" />
            <div className="h-2 w-20 rounded bg-white/5" />
          </div>
          <div className="h-5 w-14 rounded-full bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="h-2 w-20 rounded bg-white/5 mb-3" />
      <div className="h-7 w-10 rounded bg-white/5" />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ServiceTypeIcon } from '@/components/shared/ServiceTypeIcon';
import { type DokployApplication } from '@/services/projects';
import { GitBranch, Settings, Trash2, Rocket, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ServiceRowProps {
  app: DokployApplication;
  isLast?: boolean;
  onDelete?: (id: string) => void;
  onRedeploy?: (id: string) => void;
}

export function ServiceRow({ app, isLast, onDelete, onRedeploy }: ServiceRowProps) {
  const createdAt = app.createdAt ? new Date(app.createdAt) : null;
  const timeAgo = createdAt && !isNaN(createdAt.getTime())
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : '—';

  return (
    <div
      className={cn(
        'group flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.025] transition-colors',
        !isLast && 'border-b border-white/5'
      )}
    >
      <ServiceTypeIcon name={app.name} buildType={app.buildType} size="sm" />

      {/* Name + repo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{app.name}</span>
          {app.repository && (
            <span className="hidden sm:block text-xs text-zinc-600 truncate max-w-[160px]">
              {app.repository}
            </span>
          )}
        </div>
        {app.branch && (
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500">
            <GitBranch className="h-3 w-3" />
            <span>{app.branch}</span>
          </div>
        )}
      </div>

      {/* Build type pill */}
      {app.buildType && (
        <span className="hidden md:block text-[11px] font-medium text-zinc-500 capitalize bg-white/5 rounded-md px-2 py-0.5">
          {app.buildType}
        </span>
      )}

      {/* Time */}
      <span className="hidden lg:block text-xs text-zinc-600 whitespace-nowrap">{timeAgo}</span>

      {/* Status */}
      <StatusBadge status={app.applicationStatus} />

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onRedeploy && (
          <button
            onClick={() => onRedeploy(app.applicationId)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Redeploy"
          >
            <Rocket className="h-3.5 w-3.5" />
          </button>
        )}
        <Link href={`/services/${app.applicationId}`}>
          <button
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Details"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(app.applicationId)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

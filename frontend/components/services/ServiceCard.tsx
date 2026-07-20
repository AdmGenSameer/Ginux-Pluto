'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ServiceTypeIcon } from '@/components/shared/ServiceTypeIcon';
import { type DokployApplication } from '@/services/projects';
import { GitBranch, Globe, Clock, Rocket, FileText, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ServiceCardProps {
  app: DokployApplication;
  projectId: string;
  onDelete?: (id: string) => void;
  onRedeploy?: (id: string) => void;
  className?: string;
}

export function ServiceCard({ app, projectId: _projectId, onDelete, onRedeploy, className }: ServiceCardProps) {
  const createdAt = app.createdAt ? new Date(app.createdAt) : null;
  const timeAgo = createdAt && !isNaN(createdAt.getTime())
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : '—';

  const isLive = app.applicationStatus === 'running' || app.applicationStatus === 'done';

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200 overflow-hidden',
        className
      )}
    >
      {/* Top section */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <ServiceTypeIcon name={app.name} buildType={app.buildType} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{app.name}</p>
            {app.repository && (
              <p className="text-xs text-zinc-500 truncate mt-0.5">{app.repository}</p>
            )}
          </div>
        </div>
        <StatusBadge status={app.applicationStatus} />
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1.5 px-4 pb-4 flex-1">
        {app.branch && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <GitBranch className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{app.branch}</span>
          </div>
        )}
        {app.buildType && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Rocket className="h-3 w-3 flex-shrink-0" />
            <span className="capitalize">{app.buildType}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-white/5 px-3 py-2 bg-white/[0.01]">
        <div className="flex items-center gap-0.5">
          <Link href={`/services/${app.applicationId}`}>
            <button
              title="Settings"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FileText className="h-3 w-3" />
              Details
            </button>
          </Link>
          {onRedeploy && (
            <button
              title="Redeploy"
              onClick={() => onRedeploy(app.applicationId)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <Rocket className="h-3 w-3" />
              Deploy
            </button>
          )}
          {isLive && (
            <button
              title="Open"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Globe className="h-3 w-3" />
            </button>
          )}
        </div>
        {onDelete && (
          <button
            title="Delete"
            onClick={() => onDelete(app.applicationId)}
            className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

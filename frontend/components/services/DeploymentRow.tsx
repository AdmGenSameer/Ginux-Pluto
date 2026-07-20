'use client';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { type Deployment } from '@/services/deployments';
import { GitCommit, RotateCcw, FileText, Download, Rocket, User, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface DeploymentRowProps {
  deployment: Deployment;
  isLast?: boolean;
  onViewLogs?: (id: string) => void;
  onRollback?: (id: string) => void;
  onRedeploy?: (id: string) => void;
}

function getDuration(start?: string, end?: string): string {
  if (!start) return '—';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.floor((e - s) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function getTriggerIcon(source?: string) {
  switch (source?.toLowerCase()) {
    case 'push': return <Zap className="h-3 w-3" />;
    case 'manual': return <Rocket className="h-3 w-3" />;
    case 'webhook': return <GitCommit className="h-3 w-3" />;
    default: return <Rocket className="h-3 w-3" />;
  }
}

export function DeploymentRow({ deployment, isLast, onViewLogs, onRollback, onRedeploy }: DeploymentRowProps) {
  const isActive = deployment.status === 'running' || deployment.status === 'queued';

  return (
    <div
      className={cn(
        'group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors',
        !isLast && 'border-b border-white/5'
      )}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {isActive ? (
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center',
            deployment.status === 'running' || deployment.status === 'done'
              ? 'bg-emerald-500/10'
              : deployment.status === 'error'
              ? 'bg-red-500/10'
              : 'bg-zinc-500/10'
          )}>
            <GitCommit className={cn(
              'h-3.5 w-3.5',
              deployment.status === 'running' || deployment.status === 'done' ? 'text-emerald-400'
              : deployment.status === 'error' ? 'text-red-400'
              : 'text-zinc-400'
            )} />
          </div>
        )}
      </div>

      {/* Commit info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate max-w-[280px]">
            {deployment.title || `Deployment ${deployment.deploymentId?.slice(-8) || '—'}`}
          </span>
          {deployment.buildType && (
            <span className="hidden sm:block text-[11px] text-zinc-600 capitalize bg-white/5 rounded px-1.5 py-0.5">
              {deployment.buildType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {deployment.startedAt && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(deployment.startedAt), { addSuffix: true })}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-zinc-600">
            <Clock className="h-3 w-3" />
            {getDuration(deployment.startedAt, deployment.finishedAt)}
          </span>
        </div>
      </div>

      {/* Status */}
      <StatusBadge status={deployment.status} />

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onViewLogs && (
          <button
            onClick={() => onViewLogs(deployment.deploymentId)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            title="View Logs"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
        )}
        {onRedeploy && (
          <button
            onClick={() => onRedeploy(deployment.deploymentId)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Redeploy"
          >
            <Rocket className="h-3.5 w-3.5" />
          </button>
        )}
        {onRollback && (
          <button
            onClick={() => onRollback(deployment.deploymentId)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Rollback"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

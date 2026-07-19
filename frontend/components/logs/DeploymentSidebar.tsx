import React from 'react';
import { formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { CheckCircle2, XCircle, Clock3, Loader2, GitCommit, User, Clock, TerminalSquare, LayoutGrid } from 'lucide-react';
import { Deployment } from '@/services/deployments';

interface DeploymentSidebarProps {
  deployments: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'success': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'error':
    case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'running':
    case 'building':
    case 'deploying': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'success': return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'error':
    case 'failed': return <XCircle className="h-3.5 w-3.5" />;
    case 'running':
    case 'building':
    case 'deploying': return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    default: return <Clock3 className="h-3.5 w-3.5" />;
  }
};

const formatDuration = (start?: string, end?: string) => {
  if (!start || !end) return null;
  try {
    const s = differenceInSeconds(parseISO(end), parseISO(start));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  } catch {
    return null;
  }
};

export function DeploymentSidebar({ deployments, selectedId, onSelect, isLoading }: DeploymentSidebarProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-1 space-y-2 custom-scrollbar">
        {isLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : deployments.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 mt-10">No deployments found.</div>
        ) : (
          deployments.map((dep, index) => {
            const isSelected = selectedId === dep.deploymentId;
            const num = deployments.length - index;
            const duration = formatDuration(dep.startedAt || dep.createdAt, dep.finishedAt);
            
            return (
              <button
                key={dep.deploymentId}
                onClick={() => onSelect(dep.deploymentId)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-blue-500/50 bg-blue-500/10' 
                    : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">#{num}</span>
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${getStatusColor(dep.status)}`}>
                      {getStatusIcon(dep.status)}
                      {dep.status}
                    </span>
                  </div>
                  {dep.createdAt && (
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                      {formatDistanceToNow(parseISO(dep.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className="flex items-start gap-2 text-zinc-400">
                    <TerminalSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="text-xs truncate">{dep.title || 'Manual Deployment'}</span>
                  </div>
                  {/* Since Dokploy might not always give full github metadata in getDeployments without fetching repo, 
                      we just try to display what's available safely. */}
                  {duration && (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs">{duration} duration</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

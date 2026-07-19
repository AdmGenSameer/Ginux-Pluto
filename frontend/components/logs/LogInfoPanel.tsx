import React from 'react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { Info, Tag, Cpu, HardDrive, GitBranch, GitCommit, GitPullRequest, Globe, Box } from 'lucide-react';
import { Deployment } from '@/services/deployments';

interface LogInfoPanelProps {
  deployment?: Deployment;
  applicationName?: string;
  projectName?: string;
  repoFullName?: string;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '—';
  try {
    return format(parseISO(isoString), 'MMM d, yyyy HH:mm:ss');
  } catch {
    return isoString;
  }
};

const formatDuration = (start?: string, end?: string) => {
  if (!start || !end) return '—';
  try {
    const s = differenceInSeconds(parseISO(end), parseISO(start));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  } catch {
    return '—';
  }
};

export function LogInfoPanel({ deployment, applicationName, projectName, repoFullName }: LogInfoPanelProps) {
  if (!deployment) return null;

  return (
    <div className="w-80 border-l border-white/10 bg-[#0a0a0a] flex flex-col h-full overflow-y-auto shrink-0 custom-scrollbar text-sm">
      <div className="p-4 border-b border-white/10 shrink-0 flex items-center gap-2 font-semibold text-white">
        <Info className="h-4 w-4 text-zinc-400" />
        Deployment Info
      </div>

      <div className="p-4 space-y-6">
        {/* Core Metadata */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5"><Box className="h-3.5 w-3.5" /> Project</p>
            <p className="text-white truncate">{projectName || '—'}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Application</p>
            <p className="text-white truncate">{applicationName || '—'}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5"><GitPullRequest className="h-3.5 w-3.5" /> Repository</p>
            <p className="text-white truncate">{repoFullName || '—'}</p>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Git Info (if available, we mock some assuming it could be added to backend) */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Branch</p>
            <p className="text-white truncate font-mono text-xs">{deployment.title || '—'}</p>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Timings */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Created</p>
            <p className="text-white">{formatDateTime(deployment.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Started</p>
            <p className="text-white">{formatDateTime(deployment.startedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Finished</p>
            <p className="text-white">{formatDateTime(deployment.finishedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Duration</p>
            <p className="text-white">{formatDuration(deployment.startedAt || deployment.createdAt, deployment.finishedAt)}</p>
          </div>
        </div>
        
        <div className="h-px bg-white/10" />

        {/* Build Type */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Build Type</p>
            <p className="text-white capitalize">{deployment.buildType || '—'}</p>
          </div>
        </div>

      </div>
    </div>
  );
}

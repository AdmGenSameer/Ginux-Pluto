'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getProjects, type DokployProject } from '@/services/projects';
import { WorldClassLogs } from '@/components/logs/WorldClassLogs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import { ArrowLeft, GitFork, GitBranch, Loader2 } from 'lucide-react';

export default function LogsPage() {
  const params = useParams();
  const appId = params.appId as string;

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const app = projects?.flatMap((p: DokployProject) =>
    p.environments?.flatMap(e => e.applications ?? []) ?? []
  ).find((a: any) => a.applicationId === appId);

  const project = projects?.find((p: DokployProject) =>
    p.environments?.some(e => e.applications?.some(a => a.applicationId === appId))
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!app || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-zinc-400">
        <p>Application not found.</p>
        <Link href="/dashboard" className="text-blue-500 hover:underline mt-2">Go back</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-6 pt-8">
      {/* Breadcrumb Navigation */}
      <Link href={`/services/${appId}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-4">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {app.name} Settings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">{app.name} Logs</h1>
            <StatusBadge status={app.applicationStatus} />
          </div>
          {app.repository && (
            <p className="text-sm text-zinc-500 flex items-center gap-1.5">
              <GitFork className="h-3.5 w-3.5" />
              {app.repository}
              {app.branch && <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{app.branch}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Log Viewer Container */}
      <div className="flex-1 min-h-0 w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <WorldClassLogs 
          appId={appId} 
          appName={app.name} 
          projectName={project.name} 
          repoFullName={app.repository || ''} 
        />
      </div>
    </div>
  );
}

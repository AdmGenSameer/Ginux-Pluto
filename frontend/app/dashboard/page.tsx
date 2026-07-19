'use client';

import { useQuery } from '@tanstack/react-query';
import { getProjects, type DokployProject } from '@/services/projects';
import { getGithubStatus } from '@/services/github';
import { StatSkeleton } from '@/components/shared/LoadingSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import {
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  FolderOpen,
  GitFork,
  Plus,
  Rocket,
  RefreshCw,
  ArrowRight,
  Box,
} from 'lucide-react';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  loading?: boolean;
}) {
  if (loading) return <StatSkeleton />;
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    refetchInterval: 30000,
  });

  const { data: githubStatus } = useQuery({
    queryKey: ['github-status'],
    queryFn: getGithubStatus,
  });

  const allApps =
    projects?.flatMap((p: DokployProject) =>
      p.environments?.flatMap((e) => e.applications || []) ?? []
    ) ?? [];

  const totalApps = allApps.length;
  const runningApps = allApps.filter((a) => a.applicationStatus === 'running').length;
  const errorApps = allApps.filter((a) => a.applicationStatus === 'error').length;
  const idleApps = allApps.filter((a) => ['idle', 'stopped'].includes(a.applicationStatus)).length;
  const totalProjects = projects?.length ?? 0;

  const recentApps = allApps.slice(0, 6);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Overview of your deployment platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/deploy">
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors">
              <Plus className="h-3.5 w-3.5" />
              New Deployment
            </button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard
          label="Total Applications"
          value={totalApps}
          icon={Layers}
          color="bg-blue-500/10 text-blue-400"
          loading={isLoading}
        />
        <StatCard
          label="Running"
          value={runningApps}
          icon={CheckCircle}
          color="bg-green-500/10 text-green-400"
          loading={isLoading}
        />
        <StatCard
          label="Error"
          value={errorApps}
          icon={XCircle}
          color="bg-red-500/10 text-red-400"
          loading={isLoading}
        />
        <StatCard
          label="Idle"
          value={idleApps}
          icon={Clock}
          color="bg-zinc-500/10 text-zinc-400"
          loading={isLoading}
        />
        <StatCard
          label="Projects"
          value={totalProjects}
          icon={FolderOpen}
          color="bg-purple-500/10 text-purple-400"
          loading={isLoading}
        />
        <StatCard
          label="GitHub"
          value={githubStatus?.connected ? 'Connected' : 'Not Connected'}
          icon={GitFork}
          color={githubStatus?.connected ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'New Deployment', icon: Rocket, href: '/deploy', color: 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400' },
          { label: 'Create Project', icon: FolderOpen, href: '/new', color: 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-400' },
          { label: 'Connect GitHub', icon: GitFork, href: '/settings', color: 'bg-zinc-600/10 hover:bg-zinc-600/20 text-zinc-400' },
          { label: 'All Applications', icon: Layers, href: '/applications', color: 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400' },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <div className={`flex items-center gap-3 rounded-xl border border-white/5 p-4 cursor-pointer transition-colors ${action.color}`}>
              <action.icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
          <Link href="/applications" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse h-14 rounded-xl border border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : recentApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10">
            <Box className="h-8 w-8 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-500 mb-2">No applications yet</p>
            <Link href="/deploy">
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Create your first deployment →
              </button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {recentApps.map((app, idx) => {
              const project = projects?.find((p: DokployProject) =>
                p.environments?.some((e) => e.applications?.some((a) => a.applicationId === app.applicationId))
              );
              return (
                <Link key={app.applicationId} href={`/services/${app.applicationId}`}>
                  <div className={`flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer ${idx < recentApps.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                      <Box className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{app.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{project?.name}</p>
                    </div>
                    <StatusBadge status={app.applicationStatus} />
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

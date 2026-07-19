'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, type DokployProject, type DokployApplication } from '@/services/projects';
import { deployApplication, redeployApplication, stopApplication, deleteApplication } from '@/services/applications';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/LoadingSkeleton';
import Link from 'next/link';
import {
  Box, Search, RefreshCw, Rocket, RotateCcw, Square, Trash2, Settings, Plus, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const allApps: (DokployApplication & { projectName: string; projectId: string })[] =
    (projects ?? []).flatMap((p: DokployProject) =>
      (p.environments ?? []).flatMap((e) =>
        (e.applications ?? []).map((a) => ({
          ...a,
          projectName: p.name,
          projectId: p.projectId,
        }))
      )
    );

  const filtered = allApps.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.repository ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.applicationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deployMutation = useMutation({
    mutationFn: deployApplication,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Deployment started'); },
    onError: () => toast.error('Deployment failed'),
  });

  const redeployMutation = useMutation({
    mutationFn: redeployApplication,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Redeploy started'); },
    onError: () => toast.error('Redeploy failed'),
  });

  const stopMutation = useMutation({
    mutationFn: stopApplication,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Application stopped'); },
    onError: () => toast.error('Failed to stop application'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
      toast.success('Application deleted');
    },
    onError: () => toast.error('Failed to delete application — check API key permissions'),
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Applications</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{allApps.length} total applications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <Link href="/deploy">
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors">
              <Plus className="h-3.5 w-3.5" />
              New Deployment
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full rounded-lg border border-white/8 bg-white/[0.02] pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/8 p-1">
          {['all', 'running', 'idle', 'error', 'building'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No applications found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Deploy your first application to get started'}
          actionLabel="New Deployment"
          onAction={() => window.location.href = '/deploy'}
        />
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-medium text-zinc-500 border-b border-white/5">
            <div className="col-span-4">Application</div>
            <div className="col-span-2">Project</div>
            <div className="col-span-2">Repository</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filtered.map((app, idx) => (
            <div
              key={app.applicationId}
              className={`group grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-white/[0.03] transition-colors ${idx < filtered.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              {/* Name */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                  <Box className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <Link href={`/services/${app.applicationId}`}>
                    <p className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate cursor-pointer">
                      {app.name}
                    </p>
                  </Link>
                  {app.branch && (
                    <p className="text-xs text-zinc-600 truncate">{app.branch}</p>
                  )}
                </div>
              </div>

              {/* Project */}
              <div className="col-span-2 min-w-0">
                <Link href={`/projects/${app.projectId}`}>
                  <p className="text-xs text-zinc-400 hover:text-white transition-colors truncate cursor-pointer">
                    {app.projectName}
                  </p>
                </Link>
              </div>

              {/* Repository */}
              <div className="col-span-2 min-w-0">
                <p className="text-xs text-zinc-500 truncate">{app.repository || '—'}</p>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <StatusBadge status={app.applicationStatus} />
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deployMutation.mutate(app.applicationId)}
                  title="Deploy"
                  className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                >
                  <Rocket className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => redeployMutation.mutate(app.applicationId)}
                  title="Redeploy"
                  className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => stopMutation.mutate(app.applicationId)}
                  title="Stop"
                  className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
                <Link href={`/services/${app.applicationId}`}>
                  <button title="Settings" className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </Link>
                <button
                  onClick={() => setDeleteTarget(app.applicationId)}
                  title="Delete"
                  className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Application"
        description="This will permanently delete this application. This action cannot be undone."
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

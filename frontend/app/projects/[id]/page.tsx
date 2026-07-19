'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getProjects, type DokployProject } from '@/services/projects';
import { createApplication, deleteApplication } from '@/services/applications';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/LoadingSkeleton';
import Link from 'next/link';
import { ArrowLeft, Plus, Box, Trash2, Settings, RefreshCw, Rocket } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const project = projects?.find((p: DokployProject) => p.projectId === projectId);
  const environmentId = project?.environments?.[0]?.environmentId;
  const applications = project?.environments?.flatMap(e => e.applications ?? []) ?? [];

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      createApplication({ projectId, environmentId: environmentId!, name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setNewAppName('');
      if (data?.applicationId) {
        window.location.href = `/services/${data.applicationId}`;
      }
      toast.success('Service created — configure it now');
    },
    onError: () => toast.error('Failed to create service'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
      toast.success('Service deleted');
    },
    onError: () => toast.error('Failed to delete service — check API permissions'),
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="h-6 w-40 rounded bg-white/5 animate-pulse mb-8" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-zinc-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Projects
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">{project.name}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{applications.length} {applications.length === 1 ? 'service' : 'services'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Service
          </button>
        </div>
      </div>

      {/* Create Service Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6">
            <h2 className="text-base font-semibold text-white mb-1">New Service</h2>
            <p className="text-xs text-zinc-500 mb-4">You can configure the repository and settings after creation.</p>
            <input
              autoFocus
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newAppName.trim() && createMutation.mutate(newAppName.trim())}
              placeholder="Service name"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCreate(false); setNewAppName(''); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => newAppName.trim() && createMutation.mutate(newAppName.trim())}
                disabled={!newAppName.trim() || createMutation.isPending || !environmentId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services list */}
      {applications.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No services yet"
          description="Create a service to start deploying applications inside this project"
          actionLabel="New Service"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {applications.map((app, idx) => (
            <div
              key={app.applicationId}
              className={`group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors ${idx < applications.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="h-9 w-9 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                <Box className="h-4 w-4 text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{app.name}</p>
                  {app.repository && (
                    <span className="text-xs text-zinc-600">· {app.repository}</span>
                  )}
                </div>
                {app.branch && (
                  <p className="text-xs text-zinc-500 mt-0.5">branch: {app.branch}</p>
                )}
              </div>

              <StatusBadge status={app.applicationStatus} />

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/services/${app.applicationId}`}>
                  <button className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </Link>
                <button
                  onClick={() => setDeleteTarget(app.applicationId)}
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
        title="Delete Service"
        description="This will permanently delete this service and all its deployments. This action cannot be undone."
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

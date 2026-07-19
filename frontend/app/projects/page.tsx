'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject, deleteProject, type DokployProject } from '@/services/projects';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import { FolderOpen, Plus, Search, Trash2, ArrowRight, Box, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setNewName('');
      const projectId = data?.project?.projectId || data?.projectId;
      if (projectId) {
        window.location.href = `/projects/${projectId}`;
      }
      toast.success('Project created');
    },
    onError: () => toast.error('Failed to create project'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
      toast.success('Project deleted');
    },
    onError: () => toast.error('Failed to delete project — check API key permissions'),
  });

  const filtered = (projects ?? []).filter((p: DokployProject) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{projects?.length ?? 0} projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-lg border border-white/8 bg-white/[0.02] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6">
            <h2 className="text-base font-semibold text-white mb-4">New Project</h2>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMutation.mutate({ name: newName.trim() })}
              placeholder="Project name"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim() })}
                disabled={!newName.trim() || createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects found"
          description={search ? 'Try a different search term' : 'Create your first project to get started'}
          actionLabel={!search ? 'New Project' : undefined}
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project: DokployProject) => {
            const appCount = project.environments?.reduce(
              (acc, e) => acc + (e.applications?.length ?? 0), 0
            ) ?? 0;
            const allApps = project.environments?.flatMap(e => e.applications ?? []) ?? [];
            const runningCount = allApps.filter(a => a.applicationStatus === 'running').length;

            return (
              <div
                key={project.projectId}
                className="group relative rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all p-5"
              >
                {/* Delete btn */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(project.projectId); }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-600/10 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-400">{appCount} {appCount === 1 ? 'app' : 'apps'}</span>
                  </div>
                  {runningCount > 0 && (
                    <span className="text-xs text-green-400">
                      {runningCount} running
                    </span>
                  )}
                </div>

                {/* Status chips for apps */}
                {allApps.slice(0, 3).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {allApps.slice(0, 3).map(app => (
                      <span key={app.applicationId} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${app.applicationStatus === 'running' ? 'bg-green-400' : app.applicationStatus === 'error' ? 'bg-red-400' : 'bg-zinc-500'}`} />
                        {app.name}
                      </span>
                    ))}
                    {allApps.length > 3 && (
                      <span className="text-xs text-zinc-600">+{allApps.length - 3} more</span>
                    )}
                  </div>
                )}

                <Link href={`/projects/${project.projectId}`}>
                  <div className="flex items-center justify-between text-xs text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer pt-3 border-t border-white/5">
                    <span>View services</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Project"
        description="This will permanently delete the project and all its services. This action cannot be undone."
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

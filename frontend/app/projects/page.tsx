'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject, deleteProject, type DokployProject } from '@/services/projects';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import Link from 'next/link';
import {
  FolderOpen, Plus, Search, Trash2, ArrowRight, Box, RefreshCw,
  LayoutGrid, List, Layers, Activity, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      setNewDesc('');
      const projectId = data?.project?.projectId || data?.projectId;
      if (projectId) window.location.href = `/projects/${projectId}`;
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
    onError: () => toast.error('Failed to delete project'),
  });

  const filtered = (projects ?? []).filter((p: DokployProject) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function getProjectStats(project: DokployProject) {
    const allApps = project.environments?.flatMap(e => e.applications ?? []) ?? [];
    const running = allApps.filter(a => a.applicationStatus === 'running' || a.applicationStatus === 'done').length;
    const failed = allApps.filter(a => a.applicationStatus === 'error').length;
    return { total: allApps.length, running, failed, apps: allApps };
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {projects?.length ?? 0} {(projects?.length ?? 0) === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/8 p-0.5 bg-white/[0.02]">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-colors', viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-colors', viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300')}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => refetch()}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-white mb-1">New Project</h2>
            <p className="text-xs text-zinc-500 mb-4">A project groups related services together.</p>
            <div className="space-y-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMutation.mutate({ name: newName.trim(), description: newDesc.trim() })}
                placeholder="Project name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim(), description: newDesc.trim() })}
                disabled={!newName.trim() || createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 rounded-xl border border-white/5 bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects found"
          description={search ? 'Try a different search term' : 'Create your first project to start deploying applications'}
          actionLabel={!search ? 'New Project' : undefined}
          onAction={() => setShowCreate(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project: DokployProject) => {
            const { total, running, failed, apps } = getProjectStats(project);
            const createdAt = project.createdAt ? new Date(project.createdAt) : null;
            const timeAgo = createdAt && !isNaN(createdAt.getTime())
              ? formatDistanceToNow(createdAt, { addSuffix: true })
              : '—';

            return (
              <div
                key={project.projectId}
                className="group relative flex flex-col rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(project.projectId); }}
                  className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all z-10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <div className="p-5">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate pr-6">{project.name}</h3>
                      {project.description && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{project.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Layers className="h-3 w-3 text-zinc-500" />
                      <span className="text-zinc-400">{total}</span>
                      <span className="text-zinc-600">{total === 1 ? 'service' : 'services'}</span>
                    </div>
                    {running > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-emerald-400">{running} running</span>
                      </div>
                    )}
                    {failed > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        <span className="text-red-400">{failed} failed</span>
                      </div>
                    )}
                  </div>

                  {/* Service chips */}
                  {apps.slice(0, 4).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {apps.slice(0, 4).map(app => (
                        <span
                          key={app.applicationId}
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-xs text-zinc-400"
                        >
                          <span className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            app.applicationStatus === 'running' || app.applicationStatus === 'done' ? 'bg-emerald-400'
                            : app.applicationStatus === 'error' ? 'bg-red-400'
                            : app.applicationStatus === 'building' ? 'bg-blue-400 animate-pulse'
                            : 'bg-zinc-500'
                          )} />
                          {app.name}
                        </span>
                      ))}
                      {apps.length > 4 && (
                        <span className="text-xs text-zinc-600 py-0.5">+{apps.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <Link href={`/projects/${project.projectId}`} className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer px-5 py-3.5 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{timeAgo}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>View project</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {filtered.map((project: DokployProject, idx) => {
            const { total, running, apps } = getProjectStats(project);
            return (
              <div
                key={project.projectId}
                className={cn(
                  'group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors',
                  idx < filtered.length - 1 && 'border-b border-white/5'
                )}
              >
                <div className="h-8 w-8 rounded-lg bg-violet-600/10 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{project.description}</p>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
                  <Box className="h-3 w-3" />
                  <span>{total} services</span>
                </div>
                {running > 0 && (
                  <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400">
                    <Activity className="h-3 w-3" />
                    {running} running
                  </span>
                )}
                <Link href={`/projects/${project.projectId}`}>
                  <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-all px-2 py-1.5 rounded-md hover:bg-white/10">
                    Open
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </Link>
                <button
                  onClick={() => setDeleteTarget(project.projectId)}
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

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

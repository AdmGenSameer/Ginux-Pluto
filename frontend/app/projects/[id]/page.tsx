'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getProjects, type DokployProject, type DokployApplication, type UnifiedService } from '@/services/projects';
import { createApplication, deleteApplication, redeployApplication } from '@/services/applications';
import { createCompose, deleteCompose, redeployCompose } from '@/services/compose';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceRow } from '@/components/services/ServiceRow';
import { StatsBar } from '@/components/shared/StatsBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Box, RefreshCw, LayoutGrid, List,
  Search, SlidersHorizontal, Rocket, FileText, Globe,
  Activity, Layers, Calendar, Clock, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['All', 'Running', 'Building', 'Error', 'Stopped'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newAppType, setNewAppType] = useState<'application' | 'compose'>('application');
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'application' | 'compose' } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const project = projects?.find((p: DokployProject) => p.projectId === projectId);
  const environmentId = project?.environments?.[0]?.environmentId;
  const applications = project?.environments?.flatMap(e => e.applications ?? []) ?? [];
  const composes = project?.environments?.flatMap(e => e.composes ?? []) ?? [];
  
  const allServices: UnifiedService[] = [
    ...applications.map(a => ({ ...a, _type: 'application' as const })),
    ...composes.map(c => ({ ...c, _type: 'compose' as const })),
  ];

  const runningCount = allServices.filter(s => {
    const status = s._type === 'application' ? s.applicationStatus : s.composeStatus;
    return status === 'running' || status === 'done';
  }).length;
  const errorCount = allServices.filter(s => {
    const status = s._type === 'application' ? s.applicationStatus : s.composeStatus;
    return status === 'error';
  }).length;
  const buildingCount = allServices.filter(s => {
    const status = s._type === 'application' ? s.applicationStatus : s.composeStatus;
    return status === 'building';
  }).length;

  const filteredServices = allServices.filter(app => {
    const repo = app._type === 'application' ? app.repository : '';
    const status = app._type === 'application' ? app.applicationStatus : app.composeStatus;
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Running' && (status === 'running' || status === 'done')) ||
      (statusFilter === 'Building' && status === 'building') ||
      (statusFilter === 'Error' && status === 'error') ||
      (statusFilter === 'Stopped' && (status === 'stopped' || status === 'idle'));
    return matchesSearch && matchesStatus;
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (newAppType === 'application') {
        return createApplication({ projectId, environmentId: environmentId!, name: newAppName.trim(), description: newAppDesc.trim() });
      } else {
        return createCompose({ environmentId: environmentId!, name: newAppName.trim(), description: newAppDesc.trim() });
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setNewAppName('');
      setNewAppDesc('');
      setNewAppType('application');
      
      const id = newAppType === 'application' ? data?.applicationId : data?.composeId;
      const typePath = newAppType === 'application' ? 'services' : 'compose';
      if (id) window.location.href = `/${typePath}/${id}`;
      toast.success(`${newAppType === 'application' ? 'Service' : 'Compose'} created — configure it now`);
    },
    onError: () => toast.error(`Failed to create ${newAppType}`),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'application' | 'compose' }) => {
      return type === 'application' ? deleteApplication(id) : deleteCompose(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
      toast.success('Service deleted');
    },
    onError: () => toast.error('Failed to delete service'),
  });

  const redeployMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'application' | 'compose' }) => {
      return type === 'application' ? redeployApplication(id) : redeployCompose(id);
    },
    onSuccess: () => toast.success('Redeploy triggered'),
    onError: () => toast.error('Failed to redeploy'),
  });

  const createdAt = project?.createdAt ? new Date(project.createdAt) : null;
  const timeAgo = createdAt && !isNaN(createdAt.getTime())
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : '—';

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="h-5 w-32 rounded-md bg-white/5 animate-pulse mb-8" />
        <div className="h-8 w-64 rounded-md bg-white/5 animate-pulse mb-4" />
        <div className="h-20 rounded-xl bg-white/5 animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-zinc-500">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Service
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar
        className="mb-8"
        stats={[
          { label: 'Total Services', value: allServices.length, icon: Layers },
          { label: 'Running', value: runningCount, icon: Activity, valueColor: runningCount > 0 ? 'text-emerald-400' : undefined },
          { label: 'Failed', value: errorCount, icon: Activity, valueColor: errorCount > 0 ? 'text-red-400' : undefined },
          { label: 'Building', value: buildingCount, icon: Activity, valueColor: buildingCount > 0 ? 'text-blue-400' : undefined },
          { label: 'Created', value: timeAgo, icon: Calendar },
        ]}
      />

      {/* Services section header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-white flex-1">Services</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full sm:w-60 rounded-lg border border-white/8 bg-white/[0.02] pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 rounded-lg border border-white/8 p-1 bg-white/[0.02]">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                statusFilter === f ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>

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
      </div>

      {/* Services content */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={Box}
          title={search || statusFilter !== 'All' ? 'No services match your filters' : 'No services yet'}
          description={search || statusFilter !== 'All' ? 'Try adjusting your search or filter' : 'Create a service to start deploying inside this project'}
          actionLabel={!search && statusFilter === 'All' ? 'New Service' : undefined}
          onAction={() => setShowCreate(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map(app => (
            <ServiceCard
              key={app._type === 'application' ? app.applicationId : app.composeId}
              app={app}
              projectId={projectId}
              onDelete={(id, type) => setDeleteTarget({ id, type })}
              onRedeploy={(id, type) => redeployMutation.mutate({ id, type })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {filteredServices.map((app, idx) => (
            <ServiceRow
              key={app._type === 'application' ? app.applicationId : app.composeId}
              app={app}
              isLast={idx === filteredServices.length - 1}
              onDelete={(id, type) => setDeleteTarget({ id, type })}
              onRedeploy={(id, type) => redeployMutation.mutate({ id, type })}
            />
          ))}
        </div>
      )}

      {/* Create Service Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-lg font-semibold text-white">Create New Service</h2>
              <p className="text-sm text-zinc-500 mt-1">Select the type of service you want to deploy.</p>
            </div>
            
            <div className="p-6">
              {/* Toggle Segment */}
              <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 mb-6">
                <button
                  onClick={() => setNewAppType('application')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                    newAppType === 'application' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Application
                </button>
                <button
                  onClick={() => setNewAppType('compose')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                    newAppType === 'compose' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Docker Compose
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Service Name</label>
                  <input
                    autoFocus
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newAppName.trim() && createMutation.mutate()}
                    placeholder="e.g. frontend, api, worker"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Description <span className="text-zinc-600 normal-case">(optional)</span></label>
                  <input
                    value={newAppDesc}
                    onChange={(e) => setNewAppDesc(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newAppName.trim() && createMutation.mutate()}
                    placeholder="Briefly describe this service..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                {newAppType === 'application' ? (
                  <p className="text-xs text-zinc-500">You can configure the repository, build type, and environment variables after creation.</p>
                ) : (
                  <p className="text-xs text-zinc-500">You can paste your raw docker-compose.yml file after creation.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
              <button
                onClick={() => { setShowCreate(false); setNewAppName(''); setNewAppDesc(''); setNewAppType('application'); }}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => newAppName.trim() && createMutation.mutate()}
                disabled={!newAppName.trim() || createMutation.isPending || !environmentId}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50",
                  newAppType === 'application' ? "bg-blue-600 hover:bg-blue-500" : "bg-purple-600 hover:bg-purple-500"
                )}
              >
                {createMutation.isPending ? 'Creating...' : `Create ${newAppType === 'application' ? 'Application' : 'Compose'}`}
              </button>
            </div>
          </div>
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

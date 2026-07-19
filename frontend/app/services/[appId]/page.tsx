'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getProjects, type DokployProject } from '@/services/projects';
import { deployApplication, redeployApplication, stopApplication, startApplication, deleteApplication, saveProvider } from '@/services/applications';
import { getDeployments, getApplicationLogs, type Deployment, type LogEntry } from '@/services/deployments';
import { saveEnv } from '@/services/environment';
import { getDomains, createDomain, deleteDomain, type Domain } from '@/services/domains';
import { getRepositories, getBranches } from '@/services/github';
import { WorldClassLogs } from '@/components/logs/WorldClassLogs';
import { EnvironmentVariables } from '@/components/services/EnvironmentVariables';
import { DomainsList } from '@/components/services/DomainsList';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import Link from 'next/link';
import {
  ArrowLeft, Rocket, RefreshCw, Square, Play, Terminal, Save, Plus, Trash2,
  Globe, Clock, GitBranch, GitFork, Settings, Loader2, Copy, Download, Search, Check
} from 'lucide-react';
import { toast } from 'sonner';

const TABS = ['Overview', 'Deployments', 'Logs', 'Environment', 'Domains', 'Settings'] as const;
type Tab = typeof TABS[number];

export default function ServicePage() {
  const params = useParams();
  const appId = params.appId as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [showDeleteApp, setShowDeleteApp] = useState(false);

  // Logs state
  const [logSearch, setLogSearch] = useState('');
  const [autoscroll, setAutoscroll] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  // Settings state
  const [settingsRepo, setSettingsRepo] = useState('');
  const [settingsBranch, setSettingsBranch] = useState('');
  const [settingsBuildType, setSettingsBuildType] = useState('nixpacks');
  const [settingsBuildPath, setSettingsBuildPath] = useState('/');
  const [settingsAutoInit, setSettingsAutoInit] = useState(false);

  // Data
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    refetchInterval: 15000,
  });

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ['deployments', appId],
    queryFn: () => getDeployments(appId),
    enabled: activeTab === 'Deployments',
    refetchInterval: activeTab === 'Deployments' ? 8000 : false,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['logs', appId],
    queryFn: () => getApplicationLogs(appId),
    enabled: activeTab === 'Logs',
    refetchInterval: activeTab === 'Logs' ? 5000 : false,
  });

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ['domains', appId],
    queryFn: () => getDomains(appId),
    enabled: activeTab === 'Domains',
  });

  const { data: repositories } = useQuery({
    queryKey: ['repositories'],
    queryFn: getRepositories,
    enabled: activeTab === 'Settings',
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', settingsRepo],
    queryFn: () => getBranches(settingsRepo),
    enabled: !!settingsRepo && activeTab === 'Settings',
  });

  // Find app from project hierarchy
  const app = projects?.flatMap((p: DokployProject) =>
    p.environments?.flatMap(e => e.applications ?? []) ?? []
  ).find((a: any) => a.applicationId === appId);

  const project = projects?.find((p: DokployProject) =>
    p.environments?.some(e => e.applications?.some(a => a.applicationId === appId))
  );

  // Init settings from app data
  useEffect(() => {
    if (app && !settingsAutoInit) {
      setSettingsRepo(app.repository ?? '');
      setSettingsBranch(app.branch ?? '');
      setSettingsBuildType(app.buildType ?? 'nixpacks');
      setSettingsBuildPath(app.buildPath ?? '/');
      setSettingsAutoInit(true);
    }
  }, [app]);

  // Autoscroll logs
  useEffect(() => {
    if (autoscroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoscroll]);

  // Mutations
  const deployMut = useMutation({ mutationFn: () => deployApplication(appId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Deployment started'); }, onError: () => toast.error('Deploy failed') });
  const redeployMut = useMutation({ mutationFn: () => redeployApplication(appId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Redeploy started'); }, onError: () => toast.error('Redeploy failed') });
  const stopMut = useMutation({ mutationFn: () => stopApplication(appId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Application stopped'); }, onError: () => toast.error('Stop failed') });
  const startMut = useMutation({ mutationFn: () => startApplication(appId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Application started'); }, onError: () => toast.error('Start failed') });
  const deleteMut = useMutation({ mutationFn: () => deleteApplication(appId), onSuccess: () => { toast.success('Application deleted'); window.location.href = '/applications'; }, onError: () => toast.error('Delete failed — check API key permissions') });
  const saveEnvMut = useMutation({ mutationFn: (env: string) => saveEnv(appId, env), onError: () => toast.error('Failed to save env') });
  const saveProviderMut = useMutation({ mutationFn: () => saveProvider(appId, { repository: settingsRepo, branch: settingsBranch, buildType: settingsBuildType as any, buildPath: settingsBuildPath }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Settings saved'); }, onError: () => toast.error('Failed to save settings') });

  const filteredLogs = (logs ?? []).filter((l: LogEntry) =>
    !logSearch || l.message.toLowerCase().includes(logSearch.toLowerCase())
  );

  const downloadLogs = () => {
    const content = (logs ?? []).map((l: LogEntry) => l.message).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app?.name ?? 'app'}-logs.txt`;
    a.click();
  };

  const copyLogs = () => {
    const content = (logs ?? []).map((l: LogEntry) => l.message).join('\n');
    navigator.clipboard.writeText(content);
    toast.success('Logs copied to clipboard');
  };

  if (projectsLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/5" />
          <div className="h-8 w-56 rounded bg-white/5" />
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-9 w-20 rounded bg-white/5" />)}
          </div>
          <div className="h-64 rounded-xl bg-white/[0.02] border border-white/5" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Service not found</p>
        <Link href="/applications" className="text-blue-400 text-sm hover:underline mt-2 inline-block">
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Back nav */}
      {project && (
        <Link href={`/projects/${project.projectId}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          {project.name}
        </Link>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">{app.name}</h1>
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

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
        <button
          onClick={() => deployMut.mutate()}
          disabled={deployMut.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
          {deployMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
          Deploy
        </button>
        <button
          onClick={() => redeployMut.mutate()}
          disabled={redeployMut.isPending}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${redeployMut.isPending ? 'animate-spin' : ''}`} />
          Redeploy
        </button>
        <button
          onClick={() => stopMut.mutate()}
          disabled={stopMut.isPending}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors"
        >
          <Square className="h-3.5 w-3.5" />
          Stop
        </button>
        <button
          onClick={() => startMut.mutate()}
          disabled={startMut.isPending}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors"
        >
          <Play className="h-3.5 w-3.5" />
          Start
        </button>
        <Link
          href={`/services/${appId}/logs`}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors"
        >
          <Terminal className="h-3.5 w-3.5" />
          Logs
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6 overflow-x-auto">
        {TABS.map((tab) => 
          tab === 'Logs' ? (
            <Link
              key={tab}
              href={`/services/${appId}/logs`}
              className="px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap border-transparent text-zinc-500 hover:text-white"
            >
              {tab}
            </Link>
          ) : (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Application Info</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-white">{app.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><StatusBadge status={app.applicationStatus} /></div>
              <div className="flex justify-between"><span className="text-zinc-500">Project</span><span className="text-white">{project?.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Build Type</span><span className="text-white">{app.buildType || '—'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Application ID</span><span className="text-zinc-400 text-xs font-mono truncate max-w-36">{app.applicationId}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Repository</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Repository</span><span className="text-white truncate max-w-40">{app.repository || '—'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Branch</span><span className="text-white">{app.branch || '—'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Build Path</span><span className="text-white">{app.buildPath || '/'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Deployments ── */}
      {activeTab === 'Deployments' && (
        <div>
          {deploymentsLoading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.02] border border-white/5" />)}
            </div>
          ) : !deployments?.length ? (
            <div className="text-center py-16 text-zinc-500">
              <Clock className="h-8 w-8 mx-auto mb-3 text-zinc-700" />
              <p className="text-sm">No deployments yet</p>
              <p className="text-xs mt-1">Trigger a deployment to see history here</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-5 py-2.5 text-xs font-medium text-zinc-500 border-b border-white/5">
                <div className="col-span-3">Status</div>
                <div className="col-span-4">Deployment ID</div>
                <div className="col-span-3">Started</div>
                <div className="col-span-2">Duration</div>
              </div>
              {deployments.map((d: Deployment, idx: number) => {
                const started = d.startedAt ? new Date(d.startedAt) : null;
                const finished = d.finishedAt ? new Date(d.finishedAt) : null;
                const duration = started && finished ? Math.round((finished.getTime() - started.getTime()) / 1000) : null;
                return (
                  <div key={d.deploymentId} className={`grid grid-cols-12 gap-3 items-center px-5 py-3.5 ${idx < deployments.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}>
                    <div className="col-span-3"><StatusBadge status={d.status} /></div>
                    <div className="col-span-4 font-mono text-xs text-zinc-400 truncate">{d.deploymentId}</div>
                    <div className="col-span-3 text-xs text-zinc-500">{started ? started.toLocaleString() : '—'}</div>
                    <div className="col-span-2 text-xs text-zinc-500">{duration !== null ? `${duration}s` : '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Environment Variables ── */}
      {activeTab === 'Environment' && (
        <EnvironmentVariables
          initialEnv={app.env || ''}
          onSave={async (env) => {
            await saveEnvMut.mutateAsync(env);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }}
          isPending={saveEnvMut.isPending}
        />
      )}

      {/* ── Domains ── */}
      {activeTab === 'Domains' && (
        <DomainsList
          domains={domains || []}
          isLoading={domainsLoading}
          onAdd={async (payload) => {
            await createDomain(appId, payload);
            queryClient.invalidateQueries({ queryKey: ['domains', appId] });
          }}
          onDelete={async (id) => {
            await deleteDomain(id);
            queryClient.invalidateQueries({ queryKey: ['domains', appId] });
          }}
          isAdding={false}
        />
      )}

      {/* ── Settings ── */}
      {activeTab === 'Settings' && (
        <div className="space-y-6">
          {/* Provider settings */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-sm font-semibold text-white mb-4">Provider Settings</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Repository</label>
                <select
                  value={settingsRepo}
                  onChange={(e) => setSettingsRepo(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">Select repository</option>
                  {(repositories ?? []).map((r: any) => (
                    <option key={r.id || r.full_name} value={r.full_name}>{r.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Branch</label>
                  <select
                    value={settingsBranch}
                    onChange={(e) => setSettingsBranch(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">Select branch</option>
                    {(branches ?? []).map((b: any) => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Build Type</label>
                  <select
                    value={settingsBuildType}
                    onChange={(e) => setSettingsBuildType(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="nixpacks">Nixpacks (Automatic)</option>
                    <option value="dockerfile">Dockerfile</option>
                    <option value="heroku">Heroku Buildpacks</option>
                    <option value="paketo">Paketo Buildpacks</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Build Path</label>
                <input
                  value={settingsBuildPath}
                  onChange={(e) => setSettingsBuildPath(e.target.value)}
                  placeholder="/"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => saveProviderMut.mutate()}
                disabled={!settingsRepo || !settingsBranch || saveProviderMut.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 text-xs font-medium text-white transition-colors"
              >
                {saveProviderMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Settings
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="text-sm font-semibold text-red-400 mb-1">Danger Zone</p>
            <p className="text-xs text-zinc-500 mb-4">Once you delete this application, there is no going back.</p>
            <button
              onClick={() => setShowDeleteApp(true)}
              className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-xs font-medium text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Application
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDeleteApp}
        onOpenChange={setShowDeleteApp}
        title={`Delete ${app.name}`}
        description="This will permanently delete this application and all its deployments. This action cannot be undone."
        onConfirm={() => deleteMut.mutate()}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getProjects, type DokployProject } from '@/services/projects';
import {
  deployApplication, redeployApplication, stopApplication,
  startApplication, deleteApplication, saveProvider, updateApplicationSettings, removeDeployment
} from '@/services/applications';
import { getDeployments, getApplicationLogs, type Deployment, type LogEntry } from '@/services/deployments';
import { saveEnv } from '@/services/environment';
import { getDomains, createDomain, deleteDomain } from '@/services/domains';
import { getRepositories, getBranches } from '@/services/github';
import { WorldClassLogs } from '@/components/logs/WorldClassLogs';
import { EnvironmentVariables } from '@/components/services/EnvironmentVariables';
import { DomainsList } from '@/components/services/DomainsList';
import { DeploymentRow } from '@/components/services/DeploymentRow';
import { ServiceTypeIcon } from '@/components/shared/ServiceTypeIcon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TabNav } from '@/components/shared/TabNav';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import Link from 'next/link';
import {
  ArrowLeft, Rocket, RefreshCw, Square, Play, Terminal,
  Globe, GitBranch, GitFork, Settings, Loader2, Copy,
  Download, Search, ExternalLink, RotateCcw, Shield,
  Server, Cpu, MemoryStick, HardDrive, Wifi, Clock,
  CheckCircle2, XCircle, AlertCircle, ChevronRight,
  Package, Layers, Activity, Zap, Radio, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TABS = [
  { id: 'Overview',     label: 'Overview'  },
  { id: 'Deployments',  label: 'Deployments' },
  { id: 'Logs',         label: 'Logs'      },
  { id: 'Environment',  label: 'Environment' },
  { id: 'Domains',      label: 'Domains'   },
  { id: 'Build',        label: 'Build'     },
  { id: 'Runtime',      label: 'Runtime'   },
  { id: 'Health',       label: 'Health'    },
  { id: 'Settings',     label: 'Settings'  },
] as const;
type TabId = typeof TABS[number]['id'];

// ── Helper Components ──────────────────────────────────────────────

function InfoRow({ label, value, mono = false, copy = false, href }: {
  label: string;
  value?: string | null | React.ReactNode;
  mono?: boolean;
  copy?: boolean;
  href?: string;
}) {
  const text = typeof value === 'string' ? value : undefined;
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
      <span className="text-xs font-medium text-zinc-500 min-w-[140px] flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0 text-right">
        {href && text ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className={cn('text-xs text-blue-400 hover:underline truncate', mono && 'font-mono')}>
            {text}
          </a>
        ) : (
          <span className={cn('text-xs text-white break-all', mono && 'font-mono')}>
            {value ?? <span className="text-zinc-600">—</span>}
          </span>
        )}
        {copy && text && (
          <button onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied!'); }}
            className="text-zinc-600 hover:text-zinc-400 flex-shrink-0 transition-colors">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden', className)}>
      {title && (
        <div className="px-5 py-3.5 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="px-5">{children}</div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, sub, color = 'text-zinc-400', comingSoon = false }: {
  label: string; value: string; icon: React.ElementType; sub?: string; color?: string; comingSoon?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500">{label}</span>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      {comingSoon ? (
        <span className="text-xs text-zinc-600">Coming soon</span>
      ) : (
        <>
          <p className={cn('text-xl font-bold', color)}>{value}</p>
          {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function ServicePage() {
  const params = useParams();
  const appId = params.appId as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [showDeleteApp, setShowDeleteApp] = useState(false);

  // Build settings state
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('');
  const [buildType, setBuildType] = useState('nixpacks');
  const [buildPath, setBuildPath] = useState('/');
  const [port, setPort] = useState('');
  const [startCmd, setStartCmd] = useState('');
  const [buildCmd, setBuildCmd] = useState('');
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [settingsInit, setSettingsInit] = useState(false);

  // Health check state
  const [healthUrl, setHealthUrl] = useState('/health');
  const [healthPort, setHealthPort] = useState('');
  const [healthInterval, setHealthInterval] = useState('30');
  const [healthTimeout, setHealthTimeout] = useState('10');
  const [healthRetries, setHealthRetries] = useState('3');

  // Log state
  const [logSearch, setLogSearch] = useState('');
  const [autoscroll, setAutoscroll] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    refetchInterval: 15000,
  });

  const { data: deployments } = useQuery({
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

  const { data: domains } = useQuery({
    queryKey: ['domains', appId],
    queryFn: () => getDomains(appId),
    enabled: activeTab === 'Domains',
  });

  const { data: repositories } = useQuery({
    queryKey: ['repositories'],
    queryFn: getRepositories,
    enabled: activeTab === 'Build',
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', repo],
    queryFn: () => getBranches(repo),
    enabled: !!repo && activeTab === 'Build',
  });

  // Derived data
  const app = projects?.flatMap((p: DokployProject) =>
    p.environments?.flatMap(e => e.applications ?? []) ?? []
  ).find((a: any) => a.applicationId === appId);

  const project = projects?.find((p: DokployProject) =>
    p.environments?.some(e => e.applications?.some((a: any) => a.applicationId === appId))
  );

  // Init settings from app data
  useEffect(() => {
    if (app && !settingsInit) {
      setRepo(app.repository ?? '');
      setBranch(app.branch ?? '');
      setBuildType(app.buildType ?? 'nixpacks');
      setBuildPath(app.buildPath ?? '/');
      setSettingsInit(true);
    }
  }, [app, settingsInit]);

  // Autoscroll logs
  useEffect(() => {
    if (autoscroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, autoscroll]);

  // Mutations
  const deployMut = useMutation({
    mutationFn: () => deployApplication(appId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Deployment triggered'); },
    onError: () => toast.error('Deploy failed'),
  });
  const redeployMut = useMutation({
    mutationFn: () => redeployApplication(appId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Redeploy started'); },
    onError: () => toast.error('Redeploy failed'),
  });
  const stopMut = useMutation({
    mutationFn: () => stopApplication(appId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Service stopped'); },
    onError: () => toast.error('Stop failed'),
  });
  const startMut = useMutation({
    mutationFn: () => startApplication(appId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Service started'); },
    onError: () => toast.error('Start failed'),
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteApplication(appId),
    onSuccess: () => { toast.success('Service deleted'); window.location.href = project ? `/projects/${project.projectId}` : '/projects'; },
    onError: () => toast.error('Delete failed'),
  });
  const removeDeploymentMut = useMutation({
    mutationFn: (deploymentId: string) => removeDeployment(deploymentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deployments', appId] }); toast.success('Deployment removed'); },
    onError: () => toast.error('Failed to remove deployment'),
  });
  const saveProviderMut = useMutation({
    mutationFn: () => saveProvider(appId, { repository: repo, branch, buildType: buildType as any, buildPath }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Build settings saved'); },
    onError: () => toast.error('Failed to save settings'),
  });
  const saveEnvMut = useMutation({
    mutationFn: (env: string) => saveEnv(appId, env),
    onSuccess: () => toast.success('Environment variables saved'),
    onError: () => toast.error('Failed to save env vars'),
  });
  const addDomainMut = useMutation({
    mutationFn: (payload: any) => createDomain(appId, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['domains', appId] }); toast.success('Domain added'); },
    onError: () => toast.error('Failed to add domain'),
  });
  const removeDomainMut = useMutation({
    mutationFn: (domainId: string) => deleteDomain(domainId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['domains', appId] }); toast.success('Domain removed'); },
    onError: () => toast.error('Failed to remove domain'),
  });

  const isRunning = app?.applicationStatus === 'running' || app?.applicationStatus === 'done';
  const isBuilding = app?.applicationStatus === 'building';

  const downloadLogs = () => {
    const content = (logs ?? []).map((l: LogEntry) => l.message).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${app?.name ?? 'service'}-logs.txt`; a.click();
  };

  const copyLogs = () => {
    navigator.clipboard.writeText((logs ?? []).map((l: LogEntry) => l.message).join('\n'));
    toast.success('Logs copied');
  };

  if (projectsLoading) {
    return (
      <div className="flex flex-col">
        <div className="px-6 py-6 border-b border-white/5">
          <div className="h-4 w-32 rounded bg-white/5 animate-pulse mb-4" />
          <div className="h-7 w-56 rounded bg-white/5 animate-pulse mb-3" />
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 rounded bg-white/5 animate-pulse" />)}
          </div>
        </div>
        <div className="flex gap-1 px-6 border-b border-white/5">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-20 rounded bg-white/5 animate-pulse my-2" />)}
        </div>
        <div className="p-6 space-y-4">
          <div className="h-40 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
          <div className="h-40 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500 mb-3">Service not found</p>
        <Link href="/projects" className="text-sm text-blue-400 hover:underline">← Back to Projects</Link>
      </div>
    );
  }

  // After the !app guard above, app is guaranteed defined
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const safeApp = app!;

  // ── Tab Contents ────────────────────────────────────────────────────

  function renderOverview() {
    return (
      <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Health banner */}
          <div className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3',
            isRunning ? 'border-emerald-500/20 bg-emerald-500/5' :
            isBuilding ? 'border-blue-500/20 bg-blue-500/5' :
            safeApp.applicationStatus === 'error' ? 'border-red-500/20 bg-red-500/5' :
            'border-white/5 bg-white/[0.02]'
          )}>
            {isRunning ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> :
             isBuilding ? <Loader2 className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" /> :
             safeApp.applicationStatus === 'error' ? <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" /> :
             <AlertCircle className="h-4 w-4 text-zinc-400 flex-shrink-0" />}
            <div>
              <p className={cn('text-sm font-medium',
                isRunning ? 'text-emerald-400' :
                isBuilding ? 'text-blue-400' :
                safeApp.applicationStatus === 'error' ? 'text-red-400' :
                'text-zinc-400'
              )}>
                {isRunning ? 'Service is running' :
                 isBuilding ? 'Build in progress' :
                 safeApp.applicationStatus === 'error' ? 'Service has an error' :
                 `Service is ${safeApp.applicationStatus}`}
              </p>
              {safeApp.applicationStatus === 'error' && (
                <p className="text-xs text-red-300/70 mt-0.5">Check the Logs tab for details.</p>
              )}
            </div>
          </div>

          {/* Application details */}
          <SectionCard title="Application">
            <InfoRow label="Name" value={safeApp.name} />
            <InfoRow label="Status" value={<StatusBadge status={safeApp.applicationStatus} />} />
            <InfoRow label="Repository" value={safeApp.repository} mono copy href={safeApp.repository ? `https://github.com/${safeApp.repository}` : undefined} />
            <InfoRow label="Branch" value={safeApp.branch} mono />
            <InfoRow label="Build Type" value={safeApp.buildType ?? '—'} />
            <InfoRow label="Build Path" value={safeApp.buildPath ?? '/'} mono />
            <InfoRow label="Auto Deploy" value={safeApp.buildType ? 'Enabled' : 'Disabled'} />
          </SectionCard>

          {/* Runtime details */}
          <SectionCard title="Runtime">
            <InfoRow label="Environment" value="Production" />
            <InfoRow label="Port" value={port || '—'} />
            <InfoRow label="Start Command" value={startCmd || '—'} mono />
            <InfoRow label="Build Command" value={buildCmd || '—'} mono />
          </SectionCard>
        </div>

        {/* Right: Quick actions */}
        <div className="space-y-4">
          <SectionCard title="Quick Actions">
            <div className="py-3 space-y-2">
              <button
                onClick={() => deployMut.mutate()}
                disabled={deployMut.isPending || isBuilding}
                className="w-full flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-2.5 text-sm font-medium text-white transition-colors"
              >
                {deployMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Deploy
              </button>
              <button
                onClick={() => redeployMut.mutate()}
                disabled={redeployMut.isPending}
                className="w-full flex items-center gap-2 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-50 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors"
              >
                {redeployMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Redeploy
              </button>
              {isRunning ? (
                <button
                  onClick={() => stopMut.mutate()}
                  disabled={stopMut.isPending}
                  className="w-full flex items-center gap-2 rounded-lg border border-white/8 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 disabled:opacity-50 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors"
                >
                  {stopMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => startMut.mutate()}
                  disabled={startMut.isPending}
                  className="w-full flex items-center gap-2 rounded-lg border border-white/8 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 disabled:opacity-50 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors"
                >
                  {startMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start
                </button>
              )}
              <button
                onClick={() => setActiveTab('Logs')}
                className="w-full flex items-center gap-2 rounded-lg border border-white/8 hover:bg-white/5 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors"
              >
                <Terminal className="h-4 w-4" />
                View Logs
              </button>
              <button
                onClick={() => setActiveTab('Domains')}
                className="w-full flex items-center gap-2 rounded-lg border border-white/8 hover:bg-white/5 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors"
              >
                <Globe className="h-4 w-4" />
                Manage Domains
              </button>
            </div>
          </SectionCard>

          {/* Deployment summary */}
          <SectionCard title="Last Deployment">
            <div className="py-3 space-y-2">
              {safeApp.createdAt ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    {formatDistanceToNow(new Date(safeApp.createdAt), { addSuffix: true })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <GitBranch className="h-3 w-3" />
                    {safeApp.branch ?? '—'}
                  </div>
                </>
              ) : (
                <p className="text-xs text-zinc-600">No deployments yet</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  }

  function renderDeployments() {
    const deps = (deployments ?? []) as Deployment[];
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Deployment History</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['deployments', appId] })}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {deps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-white/5 bg-white/[0.02]">
            <Rocket className="h-8 w-8 text-zinc-600 mb-3" />
            <p className="text-sm font-medium text-zinc-400">No deployments yet</p>
            <p className="text-xs text-zinc-600 mt-1">Trigger your first deployment to see history here.</p>
            <button
              onClick={() => deployMut.mutate()}
              className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              <Rocket className="h-3.5 w-3.5" />
              Deploy Now
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {deps.map((d, i) => (
              <DeploymentRow
                key={d.deploymentId}
                deployment={d}
                isLast={i === deps.length - 1}
                onViewLogs={() => setActiveTab('Logs')}
                onRedeploy={() => redeployMut.mutate()}
                onDelete={(id) => {
                  if (confirm('Are you sure you want to delete this deployment history?')) {
                    removeDeploymentMut.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderLogs() {
    return (
      <div className="flex flex-col h-full">
        {/* Log toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.01]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
            <input
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full rounded-md border border-white/8 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50"
            />
          </div>
          <button
            onClick={() => setAutoscroll(v => !v)}
            className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              autoscroll ? 'bg-blue-500/15 text-blue-400' : 'text-zinc-500 hover:text-white border border-white/8'
            )}
          >
            <Activity className="h-3 w-3" />
            Auto-scroll
          </button>
          <button onClick={copyLogs} className="flex items-center gap-1.5 rounded-md border border-white/8 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
            <Copy className="h-3 w-3" /> Copy
          </button>
          <button onClick={downloadLogs} className="flex items-center gap-1.5 rounded-md border border-white/8 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
            <Download className="h-3 w-3" /> Download
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <WorldClassLogs
              appId={appId}
              appName={safeApp.name}
              projectName={project?.name ?? ''}
              repoFullName={safeApp.repository ?? ''}
            />
        </div>
      </div>
    );
  }

  function renderBuild() {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <SectionCard title="Source">
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Repository</label>
              <select
                value={repo}
                onChange={e => setRepo(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all [&>option]:bg-[#0a0a0a]"
              >
                <option value="">Select repository...</option>
                {(repositories ?? []).map((r: any) => (
                  <option key={r.name} value={r.full_name ?? r.name}>{r.full_name ?? r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Branch</label>
              <select
                value={branch}
                onChange={e => setBranch(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all [&>option]:bg-[#0a0a0a]"
              >
                <option value="">Select branch...</option>
                {(branches ?? []).map((b: any) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Build Configuration">
          <div className="py-4 space-y-4">
            <div>
              <div className="flex items-start gap-3 p-4 mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-100/90 leading-relaxed">
                  Builders can consume significant memory during the build process, ensure your server has enough resources. Some builders are suitable for development but may not be optimal for production environments.
                </p>
              </div>
              <label className="block text-sm font-semibold text-white mb-3">Build Type</label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'dockerfile', label: 'Dockerfile' },
                  { id: 'railpack', label: 'Railpack', badge: 'New' },
                  { id: 'nixpacks', label: 'Nixpacks' },
                  { id: 'heroku', label: 'Heroku Buildpacks' },
                  { id: 'paketo', label: 'Paketo Buildpacks' },
                  { id: 'static', label: 'Static' },
                ].map((option) => (
                  <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="buildType"
                        value={option.id}
                        checked={buildType === option.id}
                        onChange={(e) => setBuildType(e.target.value)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded-full border border-white/20 bg-transparent peer-checked:border-blue-500 flex items-center justify-center transition-colors group-hover:border-white/40 peer-checked:group-hover:border-blue-400">
                        <div className={cn("w-2.5 h-2.5 rounded-full bg-blue-500 transition-all", buildType === option.id ? "scale-100 opacity-100" : "scale-0 opacity-0")}></div>
                      </div>
                    </div>
                    <span className="text-sm text-zinc-200">{option.label}</span>
                    {option.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-black bg-zinc-200 rounded-full">
                        {option.badge}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Build Path</label>
              <input value={buildPath} onChange={e => setBuildPath(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
                placeholder="/" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Install Command</label>
              <input className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
                placeholder="npm install" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Build Command</label>
              <input value={buildCmd} onChange={e => setBuildCmd(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
                placeholder="npm run build" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start Command</label>
              <input value={startCmd} onChange={e => setStartCmd(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
                placeholder="node dist/index.js" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Port</label>
              <input value={port} onChange={e => setPort(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
                placeholder="3000" type="number" />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-zinc-300">Auto Deploy</p>
                <p className="text-xs text-zinc-600">Deploy automatically on git push</p>
              </div>
              <button
                onClick={() => setAutoDeploy(v => !v)}
                className={cn('relative inline-flex h-5 w-9 rounded-full transition-colors', autoDeploy ? 'bg-blue-600' : 'bg-white/10')}
              >
                <span className={cn('absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', autoDeploy && 'translate-x-4')} />
              </button>
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            onClick={() => saveProviderMut.mutate()}
            disabled={saveProviderMut.isPending || !repo}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {saveProviderMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save & Deploy
          </button>
        </div>
      </div>
    );
  }

  function renderRuntime() {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Container info */}
        <SectionCard title="Container">
          <InfoRow label="Status" value={<StatusBadge status={safeApp.applicationStatus} />} />
          <InfoRow label="Image" value="—" mono />
          <InfoRow label="Image Tag" value="latest" mono />
          <InfoRow label="Restart Policy" value="Unless Stopped" />
          <InfoRow label="Network" value="bridge" />
          <InfoRow label="Port Mapping" value={port ? `0.0.0.0:${port}→${port}/tcp` : '—'} mono />
        </SectionCard>

        {/* Metrics */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Resource Usage</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="CPU" value="—" icon={Cpu} color="text-blue-400" comingSoon />
            <MetricCard label="Memory" value="—" icon={MemoryStick} color="text-violet-400" comingSoon />
            <MetricCard label="Disk" value="—" icon={HardDrive} color="text-emerald-400" comingSoon />
            <MetricCard label="Bandwidth" value="—" icon={Wifi} color="text-amber-400" comingSoon />
          </div>
        </div>
      </div>
    );
  }

  function renderHealth() {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Current status */}
        <div className={cn(
          'flex items-center gap-3 rounded-xl border px-5 py-4',
          isRunning ? 'border-emerald-500/20 bg-emerald-500/5' :
          safeApp.applicationStatus === 'error' ? 'border-red-500/20 bg-red-500/5' :
          'border-white/5 bg-white/[0.02]'
        )}>
          {isRunning
            ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            : safeApp.applicationStatus === 'error'
            ? <XCircle className="h-5 w-5 text-red-400" />
            : <AlertCircle className="h-5 w-5 text-zinc-400" />}
          <div>
            <p className={cn('text-sm font-semibold',
              isRunning ? 'text-emerald-400' : safeApp.applicationStatus === 'error' ? 'text-red-400' : 'text-zinc-400'
            )}>
              {isRunning ? 'Healthy' : safeApp.applicationStatus === 'error' ? 'Unhealthy' : 'Unknown'}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Last checked just now</p>
          </div>
        </div>

        <SectionCard title="Health Check Configuration">
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Health Check URL</label>
              <input value={healthUrl} onChange={e => setHealthUrl(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
                placeholder="/health" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Port</label>
                <input value={healthPort} onChange={e => setHealthPort(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white font-mono placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all"
                  placeholder="3000" type="number" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Protocol</label>
                <select className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all [&>option]:bg-[#0a0a0a]">
                  <option>HTTP</option>
                  <option>HTTPS</option>
                  <option>TCP</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Interval (s)</label>
                <input value={healthInterval} onChange={e => setHealthInterval(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" type="number" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Timeout (s)</label>
                <input value={healthTimeout} onChange={e => setHealthTimeout(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" type="number" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Retries</label>
                <input value={healthRetries} onChange={e => setHealthRetries(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" type="number" />
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <SectionCard title="General">
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Service Name</label>
              <input defaultValue={safeApp.name}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
              <textarea rows={2}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 transition-all resize-none"
                placeholder="Optional description..." />
            </div>
          </div>
        </SectionCard>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-red-500/20">
            <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-200">Delete Service</p>
                <p className="text-xs text-zinc-500 mt-0.5">Permanently delete this service and all deployment history.</p>
              </div>
              <button
                onClick={() => setShowDeleteApp(true)}
                className="flex-shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors"
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabContent: Record<TabId, React.ReactNode> = {
    Overview: renderOverview(),
    Deployments: renderDeployments(),
    Logs: renderLogs(),
    Environment: (
      <div className="p-6 max-w-3xl mx-auto">
        <EnvironmentVariables
          initialEnv={safeApp.env ?? ''}
          onSave={(env) => saveEnvMut.mutateAsync(env)}
          isPending={saveEnvMut.isPending}
        />
      </div>
    ),
    Domains: (
      <div className="p-6 max-w-3xl mx-auto">
        <DomainsList
          domains={domains ?? []}
          isLoading={false}
          onAdd={(payload) => addDomainMut.mutateAsync(payload)}
          onDelete={(id) => removeDomainMut.mutateAsync(id)}
          isAdding={addDomainMut.isPending}
        />
      </div>
    ),
    Build: renderBuild(),
    Runtime: renderRuntime(),
    Health: renderHealth(),
    Settings: renderSettings(),
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-white/5">
        {project && (
          <Link href={`/projects/${project.projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-3">
            <ArrowLeft className="h-3 w-3" />
            {project.name}
          </Link>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ServiceTypeIcon name={safeApp.name} buildType={safeApp.buildType} size="lg" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white">{safeApp.name}</h1>
                <StatusBadge status={safeApp.applicationStatus} />
              </div>
              {safeApp.repository && (
                <p className="text-sm text-zinc-500 flex items-center gap-2 mt-0.5">
                  <GitFork className="h-3.5 w-3.5" />
                  {safeApp.repository}
                  {safeApp.branch && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {safeApp.branch}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => deployMut.mutate()}
              disabled={deployMut.isPending || isBuilding}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {deployMut.isPending || isBuilding
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Rocket className="h-4 w-4" />}
              {isBuilding ? 'Building...' : 'Deploy'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <TabNav
        tabs={TABS.map(t => ({
          id: t.id,
          label: t.label,
          badge: t.id === 'Deployments' ? (deployments as Deployment[] | undefined)?.length : undefined,
        }))}
        active={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {tabContent[activeTab]}
      </div>

      <ConfirmDialog
        open={showDeleteApp}
        onOpenChange={(open) => !open && setShowDeleteApp(false)}
        title="Delete Service"
        description={`This will permanently delete "${safeApp.name}" and all its deployment history. This action cannot be undone.`}
        onConfirm={() => deleteMut.mutate()}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

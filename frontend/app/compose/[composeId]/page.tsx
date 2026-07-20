'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  getCompose, updateCompose, deleteCompose,
  deployCompose, redeployCompose, stopCompose, startCompose
} from '@/services/compose';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TabNav } from '@/components/shared/TabNav';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EnvironmentVariables } from '@/components/services/EnvironmentVariables';

import Link from 'next/link';
import {
  ArrowLeft, Rocket, RefreshCw, Square, Play, Terminal,
  Settings, Copy, Save, AlertCircle, Box, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TABS = [
  { id: 'Overview',     label: 'Overview'  },
  { id: 'Compose File', label: 'Compose File' },
  { id: 'Environment',  label: 'Environment' },
  { id: 'Settings',     label: 'Settings'  },
] as const;
type TabId = typeof TABS[number]['id'];

function InfoRow({ label, value, mono = false, copy = false }: {
  label: string;
  value?: string | null | React.ReactNode;
  mono?: boolean;
  copy?: boolean;
}) {
  const text = typeof value === 'string' ? value : undefined;
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
      <span className="text-xs font-medium text-zinc-500 min-w-[140px] flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0 text-right">
        <span className={cn('text-xs text-white break-all', mono && 'font-mono')}>
          {value ?? <span className="text-zinc-600">—</span>}
        </span>
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

export default function ComposePage() {
  const params = useParams();
  const composeId = params.composeId as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  const [showDeleteCompose, setShowDeleteCompose] = useState(false);
  const [composeFileContent, setComposeFileContent] = useState('');
  const [isEditingFile, setIsEditingFile] = useState(false);

  // Queries
  const { data: response, isLoading } = useQuery({
    queryKey: ['compose', composeId],
    queryFn: () => getCompose(composeId),
    refetchInterval: 5000, // Poll every 5s for status updates
  });

  const compose = response?.result?.data?.json;

  // Sync state when data loads
  useEffect(() => {
    if (compose && !isEditingFile) {
      setComposeFileContent(compose.composeFile || '');
    }
  }, [compose, isEditingFile]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (updates: any) => updateCompose(composeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compose', composeId] });
      toast.success('Compose updated successfully');
      setIsEditingFile(false);
    },
    onError: () => toast.error('Failed to update compose'),
  });

  const actionMutation = useMutation({
    mutationFn: (action: 'deploy' | 'redeploy' | 'stop' | 'start') => {
      switch(action) {
        case 'deploy': return deployCompose(composeId);
        case 'redeploy': return redeployCompose(composeId);
        case 'stop': return stopCompose(composeId);
        case 'start': return startCompose(composeId);
      }
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['compose', composeId] });
      toast.success(`Action ${action} triggered`);
    },
    onError: (_, action) => toast.error(`Failed to trigger ${action}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCompose(composeId),
    onSuccess: () => {
      window.location.href = `/projects/${compose?.environment?.projectId}`;
    },
    onError: () => toast.error('Failed to delete compose'),
  });

  if (isLoading && !compose) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading compose...
        </div>
      </div>
    );
  }

  if (!compose) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-zinc-500">Compose service not found.</p>
      </div>
    );
  }

  const projectId = compose.environment?.projectId;
  const isRunning = compose.composeStatus === 'running' || compose.composeStatus === 'done';

  return (
    <div className="min-h-full flex flex-col">
      {/* Header section */}
      <div className="px-6 md:px-8 py-6 border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Project
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Box className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{compose.name}</h1>
                  <StatusBadge status={compose.composeStatus} />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-zinc-500">
                  <span className="capitalize">{compose.composeType || 'docker-compose'}</span>
                  <span>•</span>
                  <span>Created {compose.createdAt ? formatDistanceToNow(new Date(compose.createdAt), { addSuffix: true }) : '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <button
                    onClick={() => actionMutation.mutate('stop')}
                    disabled={actionMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop
                  </button>
                  <button
                    onClick={() => actionMutation.mutate('redeploy')}
                    disabled={actionMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Redeploy
                  </button>
                </>
              ) : (
                <button
                  onClick={() => actionMutation.mutate(compose.composeStatus === 'stopped' ? 'start' : 'deploy')}
                  disabled={actionMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  {compose.composeStatus === 'stopped' ? <Play className="h-3.5 w-3.5" /> : <Rocket className="h-3.5 w-3.5" />}
                  {compose.composeStatus === 'stopped' ? 'Start' : 'Deploy'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <TabNav tabs={TABS as any} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1 lg:col-span-2 space-y-6">
                <SectionCard title="Compose Details">
                  <InfoRow label="ID" value={compose.composeId} mono copy />
                  <InfoRow label="Name" value={compose.name} />
                  <InfoRow label="Type" value={compose.composeType || 'docker-compose'} />
                  <InfoRow label="Description" value={compose.description || 'No description provided'} />
                  <InfoRow label="Environment" value={compose.environment?.name} />
                </SectionCard>
              </div>
              <div className="space-y-6">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-white">Docker Compose</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Compose services manage multiple containers in a unified stack. Use the <strong>Compose File</strong> tab to configure your services, volumes, and networks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Compose File' && (
            <div className="flex flex-col h-[600px] border border-white/10 rounded-xl overflow-hidden bg-[#0d0d0d]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Terminal className="h-4 w-4 text-zinc-500" />
                  docker-compose.yml
                </div>
                {isEditingFile && (
                  <button
                    onClick={() => updateMutation.mutate({ composeFile: composeFileContent })}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save File
                  </button>
                )}
              </div>
              <textarea
                value={composeFileContent}
                onChange={(e) => { setComposeFileContent(e.target.value); setIsEditingFile(true); }}
                className="flex-1 w-full p-4 bg-transparent text-sm text-zinc-300 font-mono resize-none focus:outline-none focus:ring-0 leading-relaxed"
                spellCheck={false}
                placeholder="version: '3.8'&#10;services:&#10;  web:&#10;    image: nginx:latest"
              />
            </div>
          )}

          {activeTab === 'Environment' && (
            <div className="max-w-4xl">
              <EnvironmentVariables
                initialEnv={compose.env || ''}
                onSave={async (env) => {
                  await updateMutation.mutateAsync({ env });
                }}
                isPending={updateMutation.isPending}
              />
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-red-500/10 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
                    <p className="text-xs text-red-400/80 mt-1">Irreversible actions for this compose service.</p>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Delete Compose Service</h4>
                      <p className="text-xs text-zinc-500 mt-1">Permanently delete this stack and all its containers.</p>
                    </div>
                    <button
                      onClick={() => setShowDeleteCompose(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteCompose}
        onOpenChange={setShowDeleteCompose}
        title="Delete Compose Service"
        description="This will permanently delete this compose stack and all associated containers. This action cannot be undone."
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

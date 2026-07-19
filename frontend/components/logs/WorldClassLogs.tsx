import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDeployments, Deployment } from '@/services/deployments';
import { useLogs } from '../../hooks/useLogs';
import { LogToolbar } from './LogToolbar';
import { LogViewer } from './LogViewer';
import { DeploymentSidebar } from './DeploymentSidebar';
import { LogInfoPanel } from './LogInfoPanel';

interface WorldClassLogsProps {
  appId: string;
  appName: string;
  projectName: string;
  repoFullName: string;
}

export function WorldClassLogs({ appId, appName, projectName, repoFullName }: WorldClassLogsProps) {
  // Fetch deployments for this app
  const { data: deployments = [], isLoading: deploymentsLoading, refetch: refetchDeployments } = useQuery({
    queryKey: ['deployments', appId],
    queryFn: () => getDeployments(appId),
    refetchInterval: 5000,
  });

  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
  const [logView, setLogView] = useState<'build' | 'runtime'>('build');

  // Auto-select latest deployment on load
  useEffect(() => {
    if (deployments.length > 0 && !selectedDeploymentId) {
      setSelectedDeploymentId(deployments[0].deploymentId);
    }
  }, [deployments, selectedDeploymentId]);

  // View State
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Setup streaming
  const endpointUrl = logView === 'build' && selectedDeploymentId 
    ? `/deployments/${selectedDeploymentId}/logs`
    : logView === 'runtime' 
    ? `/applications/${appId}/runtime-logs`
    : null;

  const { logs, isLive, setIsLive, clearLogs, error: logError } = useLogs({
    endpointUrl,
    enabled: !!endpointUrl,
  });

  const selectedDeployment = deployments.find(d => d.deploymentId === selectedDeploymentId);

  const handleDownload = () => {
    const text = logs.map(l => l.rawText).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName}-logs-${selectedDeploymentId || 'all'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex w-full h-full bg-[#050505] text-zinc-300 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col h-full bg-[#080808] shrink-0">
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Views</h2>
          <div className="space-y-1 mb-6">
            <button
              onClick={() => setLogView('runtime')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                logView === 'runtime' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${logView === 'runtime' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="font-medium">Live Runtime Logs</span>
              </div>
            </button>
          </div>

          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Build History</h2>
          <DeploymentSidebar
            deployments={deployments}
            selectedId={selectedDeploymentId}
            onSelect={(id) => {
              setSelectedDeploymentId(id);
              setLogView('build');
              setAutoScroll(true);
            }}
            isLoading={deploymentsLoading}
          />
        </div>
      </div>

      {/* Center Main Log Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative border-r border-white/10">
        <LogToolbar
          appName={appName}
          environmentName={projectName}
          branch={selectedDeployment?.title}
          status={selectedDeployment?.status || 'Unknown'}
          isLive={isLive}
          onToggleLive={() => setIsLive(!isLive)}
          autoScroll={autoScroll}
          onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
          showTimestamps={showTimestamps}
          onToggleTimestamps={() => setShowTimestamps(!showTimestamps)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClear={clearLogs}
          onDownload={handleDownload}
          onReconnect={() => {
            refetchDeployments();
            setIsLive(true);
          }}
        />
        
        {logError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm z-50 flex items-center gap-2 shadow-xl backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Error fetching logs: {logError}
          </div>
        )}
        <LogViewer
          logs={logs}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
          showTimestamps={showTimestamps}
          searchTerm={searchTerm}
        />
      </div>

      {/* Right Sidebar */}
      <LogInfoPanel
        deployment={selectedDeployment}
        applicationName={appName}
        projectName={projectName}
        repoFullName={repoFullName}
      />
    </div>
  );
}

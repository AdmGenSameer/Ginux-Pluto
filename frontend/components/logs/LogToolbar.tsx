import React from 'react';
import { 
  Play, Pause, Download, Trash2, Search, ArrowDownToLine, 
  Clock, Moon, Sun, RefreshCw, AlertCircle, CheckCircle2, 
  Clock3, XCircle, Loader2, StopCircle
} from 'lucide-react';

interface LogToolbarProps {
  appName: string;
  environmentName?: string;
  branch?: string;
  commit?: string;
  status: string;
  
  isLive: boolean;
  onToggleLive: () => void;
  
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  
  showTimestamps: boolean;
  onToggleTimestamps: () => void;
  
  searchTerm: string;
  onSearchChange: (val: string) => void;
  
  onClear: () => void;
  onDownload: () => void;
  onReconnect: () => void;
  
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'done':
    case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'failed':
    case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
    case 'deploying':
    case 'building': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'cancelled':
    case 'stopped': return <StopCircle className="h-4 w-4 text-zinc-500" />;
    default: return <Clock3 className="h-4 w-4 text-yellow-500" />;
  }
};

export function LogToolbar({
  appName, environmentName, branch, commit, status,
  isLive, onToggleLive,
  autoScroll, onToggleAutoScroll,
  showTimestamps, onToggleTimestamps,
  searchTerm, onSearchChange,
  onClear, onDownload, onReconnect,
  isDarkTheme, onToggleTheme
}: LogToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-white/10 bg-[#0a0a0a] text-zinc-300">
      
      {/* Left: Metadata */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-white">
          {appName}
        </div>
        
        {environmentName && (
          <>
            <span className="text-zinc-600">/</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
              {environmentName}
            </span>
          </>
        )}

        {branch && (
          <>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 text-xs font-mono">{branch}</span>
          </>
        )}

        {commit && (
          <>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 text-xs font-mono">{commit.substring(0, 7)}</span>
          </>
        )}

        <span className="text-zinc-600">/</span>
        <div className="flex items-center gap-1.5 capitalize text-xs font-medium">
          {getStatusIcon(status)}
          <span>{status}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-48 bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button 
          onClick={onReconnect}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          title="Reconnect Stream"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <button 
          onClick={onToggleLive}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isLive ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isLive ? 'Live' : 'Paused'}
        </button>

        <button 
          onClick={onToggleAutoScroll}
          className={`p-1.5 rounded-md transition-colors ${
            autoScroll ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Auto Scroll"
        >
          <ArrowDownToLine className="h-4 w-4" />
        </button>

        <button 
          onClick={onToggleTimestamps}
          className={`p-1.5 rounded-md transition-colors ${
            showTimestamps ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Timestamps"
        >
          <Clock className="h-4 w-4" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button 
          onClick={onClear}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          title="Clear UI"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <button 
          onClick={onDownload}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          title="Download Logs"
        >
          <Download className="h-4 w-4" />
        </button>

        {onToggleTheme && (
          <>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button 
              onClick={onToggleTheme}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title="Toggle Theme"
            >
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

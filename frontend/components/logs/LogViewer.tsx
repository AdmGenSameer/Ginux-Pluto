import React, { useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ParsedLine, ParsedSegment } from './ansiParser';
import { parseStages } from '../../lib/logStages';
import { ArrowDown, Check, Loader2, X, CircleDashed } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface LogViewerProps {
  logs: ParsedLine[];
  autoScroll: boolean;
  setAutoScroll: (val: boolean) => void;
  showTimestamps: boolean;
  searchTerm: string;
}

const formatTimestamp = (ts: string) => {
  try {
    const d = parseISO(ts);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return ts;
  }
};

export function LogViewer({ logs, autoScroll, setAutoScroll, showTimestamps, searchTerm }: LogViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const lowerSearch = searchTerm.toLowerCase();
    return logs.filter(log => log.rawText.toLowerCase().includes(lowerSearch));
  }, [logs, searchTerm]);

  // Parse stages
  const stages = useMemo(() => parseStages(logs), [logs]);

  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  const items = rowVirtualizer.getVirtualItems();
  
  useEffect(() => {
    if (autoScroll && filteredLogs.length > 0) {
      rowVirtualizer.scrollToIndex(filteredLogs.length - 1, { align: 'end' });
    }
  }, [filteredLogs.length, autoScroll, rowVirtualizer]);

  const handleScroll = () => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    } else if (isAtBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  const renderSegment = (seg: ParsedSegment, i: number, highlight: boolean) => {
    return (
      <span key={i} className={seg.className}>
        {highlight ? (
          <span className="bg-yellow-500/30 text-yellow-200">{seg.text}</span>
        ) : seg.text}
      </span>
    );
  };

  // Check if we have any actual progress in stages
  const hasStages = stages.some(s => s.status !== 'pending');

  return (
    <div className="relative flex-1 w-full bg-[#0a0a0a] overflow-hidden flex flex-col font-sans">
      <div 
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto w-full custom-scrollbar"
      >
        <div className="w-full flex flex-col p-6">
          
          {/* Stages Panel */}
          {hasStages && (
            <div className="mb-8 w-full max-w-3xl mx-auto space-y-4">
              <h3 className="text-white font-semibold text-sm mb-4 tracking-wide">Deployment Pipeline</h3>
              <div className="grid gap-3">
                {stages.filter(s => s.status !== 'pending' || s.id === 'clone').map((stage, idx) => (
                  <div key={stage.id} className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      {stage.status === 'done' ? <Check className="h-4 w-4 text-green-500" /> :
                       stage.status === 'running' ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" /> :
                       stage.status === 'error' ? <X className="h-4 w-4 text-red-500" /> :
                       <CircleDashed className="h-4 w-4 text-zinc-600" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        stage.status === 'done' ? 'text-zinc-300' :
                        stage.status === 'running' ? 'text-blue-400' :
                        stage.status === 'error' ? 'text-red-400' : 'text-zinc-600'
                      }`}>
                        {stage.name}
                      </p>
                      {stage.duration && (
                        <p className="text-xs text-zinc-500 mt-1 font-mono">{stage.duration}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-px bg-white/10 w-full mt-6" />
              <h3 className="text-zinc-500 font-medium text-xs mt-6 uppercase tracking-widest">Live Runtime Logs</h3>
            </div>
          )}

          {/* Virtualized Terminal Logs */}
          <div className="w-full relative font-mono text-[13px] leading-6 bg-[#0a0a0a]">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                {searchTerm ? 'No logs match your search.' : 'Waiting for logs...'}
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {items.map((virtualRow) => {
                  const log = filteredLogs[virtualRow.index];
                  const isMatch = searchTerm && log.rawText.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  return (
                    <div
                      key={virtualRow.key}
                      className={`absolute top-0 left-0 w-full flex items-start group hover:bg-white/[0.02] ${
                        isMatch ? 'bg-yellow-500/10' : ''
                      } ${log.isError ? 'bg-red-500/10' : ''}`}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="w-12 shrink-0 text-zinc-600 text-right pr-4 select-none border-r border-white/5 mr-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        {virtualRow.index + 1}
                      </div>
                      
                      {showTimestamps && (
                        <div className="w-32 shrink-0 text-zinc-500 select-none mr-4 truncate">
                          {log.timestamp ? formatTimestamp(log.timestamp) : ''}
                        </div>
                      )}
                      
                      {log.detectedErrorType && (
                        <div className="mr-3 mt-1 shrink-0 px-1.5 py-0 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wide uppercase leading-4 h-4 flex items-center">
                          {log.detectedErrorType}
                        </div>
                      )}

                      <div className="flex-1 whitespace-pre-wrap break-all pr-4">
                        {log.segments.map((seg, i) => renderSegment(seg, i, false))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {!autoScroll && filteredLogs.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            rowVirtualizer.scrollToIndex(filteredLogs.length - 1, { align: 'end' });
          }}
          className="absolute bottom-6 right-8 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-medium shadow-lg shadow-black/50 transition-all border border-blue-500/50"
        >
          <ArrowDown className="h-4 w-4 animate-bounce" />
          New logs available
        </button>
      )}
    </div>
  );
}

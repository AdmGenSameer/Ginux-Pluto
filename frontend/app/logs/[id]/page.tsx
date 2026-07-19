'use client';

import { useQuery } from '@tanstack/react-query';
import { getDeploymentLogs } from '@/services/logs';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function LogsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', id],
    queryFn: () => getDeploymentLogs(id),
    refetchInterval: 3000, // Poll every 3 seconds
  });

  useEffect(() => {
    // Auto-scroll to bottom
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#A1A1AA] hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deployment Logs</h1>
            <p className="text-[#A1A1AA] text-sm">Deployment ID: {id}</p>
          </div>
        </div>
      </div>

      <Card className="flex-1 bg-black border-[#27272A] flex flex-col overflow-hidden">
        <CardHeader className="border-b border-[#27272A] bg-[#111111] py-3">
          <CardTitle className="text-sm font-mono flex items-center text-[#A1A1AA]">
            <Terminal className="mr-2 h-4 w-4" /> Build Output
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          {isLoading && !logs ? (
            <div className="flex items-center text-[#A1A1AA]"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for logs...</div>
          ) : (
            <div className="space-y-1">
              {logs?.map((log, i) => (
                <div key={i} className="flex gap-4 hover:bg-[#111111] px-2 py-1 rounded">
                  <span className="text-[#A1A1AA] shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={cn(
                    "whitespace-pre-wrap break-all",
                    log.type === 'error' && "text-red-500",
                    log.type === 'success' && "text-green-500",
                    log.type === 'info' && "text-gray-300"
                  )}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

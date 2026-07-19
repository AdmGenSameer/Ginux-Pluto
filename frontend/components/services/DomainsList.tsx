import React, { useState } from 'react';
import { Globe, Plus, Trash2, Lock, Unlock, ExternalLink, Loader2, Server } from 'lucide-react';
import { Domain } from '@/services/domains';

interface DomainsListProps {
  domains: Domain[];
  isLoading: boolean;
  onAdd: (domain: { host: string; https: boolean; port: number }) => Promise<void>;
  onDelete: (domainId: string) => Promise<void>;
  isAdding: boolean;
}

export function DomainsList({ domains, isLoading, onAdd, onDelete, isAdding }: DomainsListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [host, setHost] = useState('');
  const [https, setHttps] = useState(true);
  const [port, setPort] = useState(80);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!host.trim()) return;
    try {
      await onAdd({ host, https, port });
      setShowAdd(false);
      setHost('');
      setPort(80);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] rounded-xl border border-white/10 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0a]">
        <div>
          <h2 className="text-lg font-semibold text-white">Domains</h2>
          <p className="text-sm text-zinc-400 mt-1">Manage custom domains routing to your application.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Domain
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#050505]">
        {showAdd && (
          <div className="mb-6 p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 shadow-lg">
            <h3 className="text-sm font-medium text-white mb-4">Add Custom Domain</h3>
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Hostname</label>
                <input
                  autoFocus
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="api.example.com"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 80)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="col-span-3 pb-1">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={https}
                    onChange={(e) => setHttps(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/20"
                  />
                  Enable HTTPS
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!host.trim() || isAdding}
                className="flex items-center gap-2 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
              >
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Register Domain
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/[0.02] border border-white/5 rounded-xl border-dashed">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-zinc-500" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1">No domains configured</h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-6">
              Add a custom domain to route external traffic to this application.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Add your first domain &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <div
                key={domain.domainId}
                className="group relative flex flex-col bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${domain.https ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {domain.https ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </div>
                  <button
                    onClick={() => handleDelete(domain.domainId)}
                    disabled={deletingId === domain.domainId}
                    className="text-zinc-600 hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10 transition-colors"
                  >
                    {deletingId === domain.domainId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                <h3 className="text-base font-semibold text-white mb-1 truncate" title={domain.host}>
                  {domain.host}
                </h3>
                
                <div className="flex items-center gap-3 mt-auto pt-4 text-xs font-medium text-zinc-500">
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                    <Server className="h-3.5 w-3.5" />
                    Port {domain.port}
                  </span>
                  <a
                    href={`http${domain.https ? 's' : ''}://${domain.host}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                  >
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

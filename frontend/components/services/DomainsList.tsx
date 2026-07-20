import React, { useState } from 'react';
import { Globe, Plus, Trash2, Lock, Unlock, ExternalLink, Loader2, Server } from 'lucide-react';
import { Domain } from '@/services/domains';

interface DomainsListProps {
  domains: Domain[];
  isLoading: boolean;
  onAdd: (domain: { 
    host: string; 
    https: boolean; 
    port: number;
    path: string;
    internalPath: string;
    stripPath: boolean;
    customEntrypoint: string;
    certificateType: string;
    middlewares: string;
  }) => Promise<void>;
  onDelete: (domainId: string) => Promise<void>;
  isAdding: boolean;
}

export function DomainsList({ domains, isLoading, onAdd, onDelete, isAdding }: DomainsListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [host, setHost] = useState('');
  const [path, setPath] = useState('/');
  const [internalPath, setInternalPath] = useState('/');
  const [stripPath, setStripPath] = useState(false);
  const [port, setPort] = useState(3000);
  const [customEntrypointStr, setCustomEntrypointStr] = useState('');
  const [useCustomEntrypoint, setUseCustomEntrypoint] = useState(false);
  const [https, setHttps] = useState(true);
  const [certificateType, setCertificateType] = useState('letsencrypt');
  const [middlewares, setMiddlewares] = useState('');
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!host.trim()) return;
    try {
      await onAdd({ 
        host, https, port, path, internalPath, stripPath, 
        customEntrypoint: useCustomEntrypoint ? customEntrypointStr : '', 
        certificateType, middlewares 
      });
      setShowAdd(false);
      setHost('');
      setPath('/');
      setInternalPath('/');
      setStripPath(false);
      setPort(3000);
      setUseCustomEntrypoint(false);
      setCustomEntrypointStr('');
      setHttps(true);
      setCertificateType('letsencrypt');
      setMiddlewares('');
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
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {showAdd ? <Loader2 className="h-4 w-4 opacity-0 hidden" /> : <Plus className="h-4 w-4" />}
          {showAdd ? 'Cancel' : 'Add Domain'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#050505]">
        {showAdd && (
          <div className="mb-6 p-6 rounded-xl border border-blue-500/30 bg-blue-500/5 shadow-lg space-y-5">
            <div>
              <h3 className="text-sm font-medium text-white">Add Custom Domain</h3>
              <p className="text-xs text-zinc-400 mt-1">Configure advanced routing for your application</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Host</label>
                <input
                  autoFocus
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="api.dokploy.com"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Path</label>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Internal Path</label>
                <input
                  value={internalPath}
                  onChange={(e) => setInternalPath(e.target.value)}
                  placeholder="/"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <h4 className="text-sm font-medium text-white">Strip Path</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Remove the external path from the request before forwarding</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={stripPath} onChange={(e) => setStripPath(e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Container Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 80)}
                placeholder="3000"
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-zinc-500 mt-1.5">The port where your application is running inside the container (e.g. 3000 for Node.js)</p>
            </div>

            <div className="flex flex-col gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Custom Entrypoint</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Use custom entrypoint for domain ("web" and/or "websecure" used by default)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={useCustomEntrypoint} onChange={(e) => setUseCustomEntrypoint(e.target.checked)} />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {useCustomEntrypoint && (
                <div className="pt-2">
                  <input
                    value={customEntrypointStr}
                    onChange={(e) => setCustomEntrypointStr(e.target.value)}
                    placeholder="e.g. websecure"
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <h4 className="text-sm font-medium text-white">HTTPS</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Automatically provision SSL Certificate</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={https} onChange={(e) => setHttps(e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {https && (
              <div className="p-4 rounded-lg bg-[#0a0a0a] border border-white/10">
                <label className="block text-xs font-medium text-zinc-400 mb-2">Certificate Provider</label>
                <select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all appearance-none [&>option]:bg-[#0a0a0a]"
                >
                  <option value="letsencrypt">Let's Encrypt</option>
                  <option value="none">None</option>
                </select>
                <p className="text-xs text-zinc-500 mt-2">Let's Encrypt auto-provisions a certificate automatically for this host.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Middlewares</label>
              <div className="flex gap-2">
                <input
                  value={middlewares}
                  onChange={(e) => setMiddlewares(e.target.value)}
                  placeholder="e.g., rate-limit@file, auth@file"
                  className="flex-1 rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
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
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Domain
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

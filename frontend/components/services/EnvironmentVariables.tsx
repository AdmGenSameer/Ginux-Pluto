import React, { useState, useEffect } from 'react';
import { Save, Check, Loader2, Plus, Trash2, Eye, EyeOff, FileText, List } from 'lucide-react';
import { parseEnvString } from '@/services/environment';
import { toast } from 'sonner';

interface EnvironmentVariablesProps {
  initialEnv: string;
  onSave: (env: string) => Promise<void>;
  isPending: boolean;
}

export function EnvironmentVariables({ initialEnv, onSave, isPending }: EnvironmentVariablesProps) {
  const [mode, setMode] = useState<'kv' | 'bulk'>('kv');
  const [bulkContent, setBulkContent] = useState(initialEnv || '');
  const [kvPairs, setKvPairs] = useState<{ key: string; value: string; hidden: boolean }[]>([]);
  const [envSaved, setEnvSaved] = useState(false);

  useEffect(() => {
    setBulkContent(initialEnv || '');
    const parsed = parseEnvString(initialEnv || '');
    setKvPairs(parsed.map(p => ({ ...p, hidden: true })));
  }, [initialEnv]);

  const syncToBulk = (pairs: { key: string; value: string }[]) => {
    return pairs.map(p => `${p.key}=${p.value}`).join('\n');
  };

  const handleModeSwitch = (newMode: 'kv' | 'bulk') => {
    if (newMode === 'kv' && mode === 'bulk') {
      const parsed = parseEnvString(bulkContent);
      setKvPairs(parsed.map(p => ({ ...p, hidden: true })));
    } else if (newMode === 'bulk' && mode === 'kv') {
      const activePairs = kvPairs.filter(p => p.key.trim() !== '');
      setBulkContent(syncToBulk(activePairs));
    }
    setMode(newMode);
  };

  const handleSave = async () => {
    const finalEnv = mode === 'bulk' ? bulkContent : syncToBulk(kvPairs.filter(p => p.key.trim() !== ''));
    try {
      await onSave(finalEnv);
      setEnvSaved(true);
      setTimeout(() => setEnvSaved(false), 2000);
    } catch {
      // Error handled by mutation
    }
  };

  const addKvPair = () => {
    setKvPairs([...kvPairs, { key: '', value: '', hidden: false }]);
  };

  const updateKv = (index: number, field: 'key' | 'value', val: string) => {
    const newPairs = [...kvPairs];
    newPairs[index][field] = val;
    setKvPairs(newPairs);
  };

  const removeKv = (index: number) => {
    setKvPairs(kvPairs.filter((_, i) => i !== index));
  };

  const toggleHidden = (index: number) => {
    const newPairs = [...kvPairs];
    newPairs[index].hidden = !newPairs[index].hidden;
    setKvPairs(newPairs);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] rounded-xl border border-white/10 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0a]">
        <div>
          <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
          <p className="text-sm text-zinc-400 mt-1">Variables are encrypted and injected into your application at runtime.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => handleModeSwitch('kv')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'kv' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <List className="h-4 w-4" />
              Key-Value
            </button>
            <button
              onClick={() => handleModeSwitch('bulk')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'bulk' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              Bulk Edit
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : envSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {envSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#050505]">
        {mode === 'bulk' ? (
          <textarea
            value={bulkContent}
            onChange={(e) => setBulkContent(e.target.value)}
            placeholder={'PORT=3000\nDATABASE_URL=postgres://...\nSECRET_KEY=...'}
            className="w-full h-full min-h-[400px] rounded-xl border border-white/10 bg-[#0a0a0a] p-4 font-mono text-sm text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
            spellCheck={false}
          />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <div className="col-span-4">Key</div>
              <div className="col-span-7">Value</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            <div className="space-y-3">
              {kvPairs.map((pair, idx) => (
                <div key={idx} className="group grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-4">
                    <input
                      value={pair.key}
                      onChange={(e) => updateKv(idx, 'key', e.target.value)}
                      placeholder="KEY_NAME"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2.5 font-mono text-sm text-white placeholder:text-zinc-700 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="col-span-7 relative">
                    <input
                      type={pair.hidden ? 'password' : 'text'}
                      value={pair.value}
                      onChange={(e) => updateKv(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-2.5 pr-10 font-mono text-sm text-white placeholder:text-zinc-700 outline-none focus:border-blue-500 transition-all"
                    />
                    <button
                      onClick={() => toggleHidden(idx)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {pair.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="col-span-1 flex items-center justify-end h-[42px]">
                    <button
                      onClick={() => removeKv(idx)}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addKvPair}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white border border-dashed border-white/10 hover:border-white/30 rounded-lg hover:bg-white/5 transition-all w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              Add Variable
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

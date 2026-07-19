'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Rocket } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email && password) {
        localStorage.setItem('token', 'mock-jwt-token-12345');
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        toast.error('Please enter your email and password');
      }
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 mb-4">
            <Box className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CloudDeploy</h1>
          <p className="text-sm text-zinc-500 mt-1">Deploy applications in seconds</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <>
                  <Rocket className="h-3.5 w-3.5" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          CloudDeploy — Powered by Dokploy
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { LogOut, GitPullRequest, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function SettingsPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial check for providers
    const checkProviders = async () => {
      try {
        const { data } = await api.get('/github/providers');
        if (data && data.length > 0) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to check initial providers', error);
      }
    };
    checkProviders();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling && !isConnected) {
      interval = setInterval(async () => {
        try {
          const { data } = await api.get('/github/providers');
          if (data && data.length > 0) {
            setIsConnected(true);
            setIsPolling(false);
            toast.success('GitHub Connected successfully!');
          }
        } catch (error) {
          console.error('Error polling for providers:', error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPolling, isConnected]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleConnectGithub = async () => {
    try {
      setIsConnecting(true);
      const { data } = await api.get('/github/connect');
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.action;
      form.target = '_blank'; // Open in new tab so they return here

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'manifest';
      input.value = JSON.stringify(data.manifest);

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      setIsPolling(true);
      toast.info('Waiting for GitHub connection...');
    } catch (error) {
      console.error('Failed to initiate GitHub connect', error);
      toast.error('Failed to start GitHub connection flow');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-[#A1A1AA] mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <Card className="bg-[#111111] border-[#27272A] text-white">
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription className="text-[#A1A1AA]">
              Configure your connection to the deployment gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input 
                type="password" 
                defaultValue="mock-jwt-token-12345"
                className="bg-[#09090B] border-[#27272A] text-white font-mono" 
                readOnly
              />
              <p className="text-xs text-[#A1A1AA]">This token is used to authenticate requests to the backend API.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-[#27272A] text-white">
          <CardHeader>
            <CardTitle>GitHub Integration</CardTitle>
            <CardDescription className="text-[#A1A1AA]">
              Connect your GitHub account to enable automatic deployments from your repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">GitHub Account</p>
                <p className="text-sm text-[#A1A1AA]">
                  {isConnected ? (
                    <span className="text-green-500 flex items-center mt-1">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Connected
                    </span>
                  ) : isPolling ? (
                    <span className="text-yellow-500 flex items-center mt-1">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Waiting for connection...
                    </span>
                  ) : (
                    "Not connected"
                  )}
                </p>
              </div>
              
              {!isConnected && (
                <Button 
                  onClick={handleConnectGithub} 
                  disabled={isConnecting || isPolling}
                  className="bg-[#24292e] text-white hover:bg-[#2f363d]"
                >
                  {(isConnecting || isPolling) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GitPullRequest className="mr-2 h-4 w-4" />
                  )}
                  {isPolling ? 'Connecting...' : 'Connect GitHub'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-red-900/50 text-white">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription className="text-[#A1A1AA]">
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-[#A1A1AA]">End your current session</p>
              </div>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

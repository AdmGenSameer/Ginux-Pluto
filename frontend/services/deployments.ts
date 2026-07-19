import api from './api';

export interface Deployment {
  deploymentId: string;
  status: 'running' | 'done' | 'error' | 'queued' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  buildType?: string;
  title?: string;
  logPath?: string;
}

export interface LogEntry {
  type: 'info' | 'error' | 'warn' | 'success';
  message: string;
  timestamp: string;
}

export const getDeployments = async (applicationId: string): Promise<Deployment[]> => {
  const { data } = await api.get(`/applications/${applicationId}/deployments`);
  return data;
};

export const getApplicationLogs = async (applicationId: string): Promise<LogEntry[]> => {
  const { data } = await api.get(`/applications/${applicationId}/logs`);
  return data;
};

export const getDeploymentLogs = async (deploymentId: string): Promise<LogEntry[]> => {
  const { data } = await api.get(`/deployments/${deploymentId}/logs`);
  return data;
};

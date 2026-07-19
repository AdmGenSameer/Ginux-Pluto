import api from './api';

// ─── Types ───────────────────────────────────────

export interface DokployApplication {
  applicationId: string;
  name: string;
  applicationStatus: 'idle' | 'running' | 'error' | 'building' | 'done' | 'stopped';
  repository?: string;
  branch?: string;
  buildType?: string;
  buildPath?: string;
  env?: string;
  createdAt?: string;
}

export interface DokployEnvironment {
  environmentId: string;
  name: string;
  isDefault: boolean;
  applications: DokployApplication[];
}

export interface DokployProject {
  projectId: string;
  name: string;
  description: string;
  createdAt: string;
  environments: DokployEnvironment[];
}

// ─── API Functions ───────────────────────────────

export const getProjects = async (): Promise<DokployProject[]> => {
  const { data } = await api.get('/projects');
  return data;
};

export const createProject = async (payload: { name: string; description?: string }) => {
  const { data } = await api.post('/projects', payload);
  return data;
};

export const deleteProject = async (projectId: string) => {
  const { data } = await api.delete(`/projects/${projectId}`);
  return data;
};

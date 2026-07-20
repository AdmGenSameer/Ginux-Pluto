import api from './api';
import type { DokployApplication } from './projects';

export type { DokployApplication };

export interface CreateApplicationPayload {
  projectId: string;
  environmentId: string;
  name: string;
  description?: string;
}

export interface ProviderPayload {
  repository: string;
  branch: string;
  buildType: 'nixpacks' | 'dockerfile' | 'heroku' | 'static';
  buildPath?: string;
}

export interface ApplicationSettings {
  name?: string;
  buildType?: string;
  buildPath?: string;
  dockerfilePath?: string;
  port?: number;
  startCommand?: string;
  buildCommand?: string;
  autoDeploy?: boolean;
}

export const createApplication = async (payload: CreateApplicationPayload) => {
  const { data } = await api.post('/applications', payload);
  return data;
};

export const deleteApplication = async (applicationId: string) => {
  const { data } = await api.delete(`/applications/${applicationId}`);
  return data;
};

export const deployApplication = async (applicationId: string) => {
  const { data } = await api.post(`/applications/${applicationId}/deploy`, { applicationId });
  return data;
};

export const redeployApplication = async (applicationId: string) => {
  const { data } = await api.post(`/applications/${applicationId}/redeploy`);
  return data;
};

export const stopApplication = async (applicationId: string) => {
  const { data } = await api.post(`/applications/${applicationId}/stop`);
  return data;
};

export const startApplication = async (applicationId: string) => {
  const { data } = await api.post(`/applications/${applicationId}/start`);
  return data;
};

export const removeDeployment = async (deploymentId: string) => {
  const { data } = await api.delete(`/deployments/${deploymentId}`);
  return data;
};

export const updateApplicationSettings = async (applicationId: string, settings: ApplicationSettings) => {
  const { data } = await api.put(`/applications/${applicationId}/settings`, settings);
  return data;
};

export const saveProvider = async (applicationId: string, payload: ProviderPayload) => {
  const { data } = await api.post(`/applications/${applicationId}/provider`, payload);
  return data;
};

import api from './api';

export const deployProject = async (projectId: string) => {
  const { data } = await api.post('/deploy', { projectId });
  return data;
};

export const redeployProject = async (projectId: string) => {
  const { data } = await api.post('/redeploy', { projectId });
  return data;
};

export const getProjectStatus = async (projectId: string) => {
  const { data } = await api.get(`/status/${projectId}`);
  return data;
};

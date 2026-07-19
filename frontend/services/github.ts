import api from './api';

export const getGithubStatus = async (): Promise<{ connected: boolean; providers: any[] }> => {
  const { data } = await api.get('/github/status');
  return data;
};

export const getRepositories = async (): Promise<any[]> => {
  const { data } = await api.get('/repositories');
  return data;
};

export const getBranches = async (repository: string): Promise<any[]> => {
  const { data } = await api.get(`/branches?repository=${encodeURIComponent(repository)}`);
  return data;
};

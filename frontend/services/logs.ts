import api from './api';

export type LogMessage = {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: string;
};

export const getDeploymentLogs = async (deploymentId: string): Promise<LogMessage[]> => {
  const { data } = await api.get(`/logs/${deploymentId}`);
  return data;
};

import api from './api';

export interface Domain {
  domainId: string;
  host: string;
  https: boolean;
  port: number;
  certificateType: string;
  createdAt: string;
}

export const getDomains = async (applicationId: string): Promise<Domain[]> => {
  const { data } = await api.get(`/applications/${applicationId}/domains`);
  return data;
};

export const createDomain = async (
  applicationId: string,
  payload: { host: string; https?: boolean; port?: number }
) => {
  const { data } = await api.post(`/applications/${applicationId}/domains`, payload);
  return data;
};

export const deleteDomain = async (domainId: string) => {
  const { data } = await api.delete(`/domains/${domainId}`);
  return data;
};

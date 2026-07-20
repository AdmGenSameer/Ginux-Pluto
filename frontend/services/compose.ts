import api from './api';

export interface CreateComposePayload {
  name: string;
  environmentId: string;
  description?: string;
}

export const createCompose = async (payload: CreateComposePayload) => {
  const { data } = await api.post('/compose', payload);
  return data;
};

export const getCompose = async (composeId: string) => {
  const { data } = await api.get(`/compose/${composeId}`);
  return data;
};

export const updateCompose = async (composeId: string, payload: any) => {
  const { data } = await api.put(`/compose/${composeId}`, payload);
  return data;
};

export const deleteCompose = async (composeId: string) => {
  const { data } = await api.delete(`/compose/${composeId}`);
  return data;
};

export const deployCompose = async (composeId: string) => {
  const { data } = await api.post(`/compose/${composeId}/deploy`);
  return data;
};

export const redeployCompose = async (composeId: string) => {
  const { data } = await api.post(`/compose/${composeId}/redeploy`);
  return data;
};

export const stopCompose = async (composeId: string) => {
  const { data } = await api.post(`/compose/${composeId}/stop`);
  return data;
};

export const startCompose = async (composeId: string) => {
  const { data } = await api.post(`/compose/${composeId}/start`);
  return data;
};

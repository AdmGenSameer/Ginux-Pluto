import api from './api';

export const saveEnv = async (applicationId: string, env: string) => {
  const { data } = await api.post(`/applications/${applicationId}/env`, { env });
  return data;
};

/**
 * Parses a .env string into an array of key/value pairs for display.
 */
export const parseEnvString = (envString: string): { key: string; value: string }[] => {
  return envString
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) return null;
      const key = line.substring(0, eqIdx).trim();
      const value = line.substring(eqIdx + 1).trim();
      return { key, value };
    })
    .filter(Boolean) as { key: string; value: string }[];
};

/**
 * Serializes key/value pairs back to a .env string.
 */
export const serializeEnv = (pairs: { key: string; value: string }[]): string => {
  return pairs.map((p) => `${p.key}=${p.value}`).join('\n');
};

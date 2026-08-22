/**
 * useNetworkClient — Hook pour se connecter au serveur MugiDoc en réseau local
 * Utilisé sur le PC de la secrétaire (mode client)
 */

export interface NetworkConfig {
  serverIP: string;
  port: number;
  enabled: boolean;
  token?: string;
}

const getNetworkConfig = (): NetworkConfig => {
  try {
    const stored = localStorage.getItem('mugidoc_network_config');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { serverIP: '', port: 3737, enabled: false, token: '' };
};

const saveNetworkConfig = (config: NetworkConfig): void => {
  localStorage.setItem('mugidoc_network_config', JSON.stringify(config));
};

const buildUrl = (config: NetworkConfig, path: string): string => {
  return `http://${config.serverIP}:${config.port}/api${path}`;
};

const networkFetch = async (config: NetworkConfig, path: string, options: RequestInit = {}): Promise<any> => {
  const url = buildUrl(config, path);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-mugidoc-token': config.token || '',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
};

/**
 * Teste la connexion au serveur
 */
export const testNetworkConnection = async (serverIP: string, token: string, port = 3737): Promise<boolean> => {
  try {
    const config: NetworkConfig = { serverIP, port, enabled: true, token };
    const result = await networkFetch(config, '/health');
    return result.status === 'ok';
  } catch {
    return false;
  }
};

/**
 * Construit une API proxy qui appelle le serveur réseau au lieu de Electron
 */
export const buildNetworkAPI = (config: NetworkConfig) => {
  const get = (path: string) => networkFetch(config, path);
  const post = (path: string, body: any) =>
    networkFetch(config, path, { method: 'POST', body: JSON.stringify(body) });
  const put = (path: string, body: any) =>
    networkFetch(config, path, { method: 'PUT', body: JSON.stringify(body) });
  const del = (path: string) =>
    networkFetch(config, path, { method: 'DELETE' });

  return {
    patients: {
      getAll: () => get('/patients'),
      getById: (id: number) => get(`/patients/${id}`),
      create: (data: any) => post('/patients', data),
      update: (id: number, data: any) => put(`/patients/${id}`, data),
      delete: (id: number) => del(`/patients/${id}`),
    },
    appointments: {
      getAll: () => get('/appointments'),
      create: (data: any) => post('/appointments', data),
      update: (id: number, data: any) => put(`/appointments/${id}`, data),
      delete: (id: number) => del(`/appointments/${id}`),
    },
    consultations: {
      getAll: () => get('/consultations'),
      getByPatient: (patientId: number) => get(`/consultations/patient/${patientId}`),
      create: (data: any) => post('/consultations', data),
      update: (id: number, data: any) => put(`/consultations/${id}`, data),
    },
    prescriptions: {
      getAll: () => get('/prescriptions'),
      getByPatient: (patientId: number) => get(`/prescriptions/patient/${patientId}`),
    },
    payments: {
      getAll: () => get('/payments'),
      create: (data: any) => post('/payments', data),
    },
    settings: {
      getAll: () => get('/settings'),
      getByKey: (key: string) => get(`/settings/${key}`),
    },
    waitingRoom: {
      getTodayQueue: () => get('/waiting-room'),
      addToQueue: (data: any) => post('/waiting-room', data),
      updateStatus: (id: number, status: string) => put(`/waiting-room/${id}/status`, { status }),
      updateEntry: (id: number, data: any) => put(`/waiting-room/${id}`, data),
      removeFromQueue: (id: number) => del(`/waiting-room/${id}`),
    },
  };
};

export { getNetworkConfig, saveNetworkConfig };

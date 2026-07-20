import { dokployApi, dokployRestApi, DOKPLOY_URL } from '../config/dokploy';

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

export const getProjects = async () => {
  try {
    const { data } = await dokployApi.get('/project.all');
    return data?.result?.data?.json || [];
  } catch (error: any) {
    console.error('Dokploy error getProjects:', error?.response?.data || error.message);
    return [];
  }
};

export const createProject = async (name: string, description: string = '') => {
  try {
    const { data } = await dokployApi.post('/project.create', { json: { name, description } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error createProject:', error?.response?.data || error.message);
    throw new Error('Failed to create project');
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    const { data } = await dokployRestApi.post('/project.remove', { projectId });
    return data;
  } catch (error: any) {
    console.error('Dokploy error deleteProject:', error?.response?.data || error.message);
    throw new Error('Failed to delete project');
  }
};

export const getProject = async (projectId: string) => {
  try {
    const inputPayload = JSON.stringify({ json: { projectId } });
    const { data } = await dokployApi.get('/project.one', {
      params: { input: inputPayload }
    });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error getProject:', error?.response?.data || error.message);
    throw new Error('Failed to get project');
  }
};

export const updateProject = async (projectId: string, updates: { name?: string; description?: string; env?: string }) => {
  try {
    const { data } = await dokployRestApi.post('/project.update', { projectId, ...updates });
    return data;
  } catch (error: any) {
    console.error('Dokploy error updateProject:', error?.response?.data || error.message);
    throw new Error('Failed to update project');
  }
};

export const duplicateProject = async (payload: { sourceEnvironmentId: string; name: string; description?: string; includeServices?: boolean; selectedServices?: any[]; duplicateInSameProject?: boolean }) => {
  try {
    const { data } = await dokployRestApi.post('/project.duplicate', payload);
    return data;
  } catch (error: any) {
    console.error('Dokploy error duplicateProject:', error?.response?.data || error.message);
    throw new Error('Failed to duplicate project');
  }
};

// ─────────────────────────────────────────────
// COMPOSE
// ─────────────────────────────────────────────

export const createCompose = async (name: string, environmentId: string, description: string = '') => {
  try {
    const { data } = await dokployRestApi.post('/compose.create', { name, environmentId, description });
    return data;
  } catch (error: any) {
    console.error('Dokploy error createCompose:', error?.response?.data || error.message);
    throw new Error('Failed to create compose');
  }
};

export const getCompose = async (composeId: string) => {
  try {
    const { data } = await dokployApi.get('/compose.one', { params: { composeId } });
    return data;
  } catch (error: any) {
    console.error('Dokploy error getCompose:', error?.response?.data || error.message);
    throw new Error('Failed to get compose');
  }
};

export const updateCompose = async (composeId: string, updates: any) => {
  try {
    const { data } = await dokployRestApi.post('/compose.update', { composeId, ...updates });
    return data;
  } catch (error: any) {
    console.error('Dokploy error updateCompose:', error?.response?.data || error.message);
    throw new Error('Failed to update compose');
  }
};

export const deleteCompose = async (composeId: string) => {
  try {
    const { data } = await dokployRestApi.post('/compose.delete', { composeId, deleteVolumes: false });
    return data;
  } catch (error: any) {
    console.error('Dokploy error deleteCompose:', error?.response?.data || error.message);
    throw new Error('Failed to delete compose');
  }
};

export const deployCompose = async (composeId: string) => {
  try {
    const { data } = await dokployRestApi.post('/compose.deploy', { composeId });
    return data;
  } catch (error: any) {
    console.error('Dokploy error deployCompose:', error?.response?.data || error.message);
    throw new Error('Failed to deploy compose');
  }
};

export const redeployCompose = async (composeId: string) => {
  try {
    const { data } = await dokployRestApi.post('/compose.redeploy', { composeId });
    return data;
  } catch (error: any) {
    console.error('Dokploy error redeployCompose:', error?.response?.data || error.message);
    throw new Error('Failed to redeploy compose');
  }
};

export const stopCompose = async (composeId: string) => {
  try {
    const { data } = await dokployRestApi.post('/compose.stop', { composeId });
    return data;
  } catch (error: any) {
    console.error('Dokploy error stopCompose:', error?.response?.data || error.message);
    throw new Error('Failed to stop compose');
  }
};

export const startCompose = async (composeId: string) => {
  try {
    const { data } = await dokployRestApi.post('/compose.start', { composeId });
    return data;
  } catch (error: any) {
    console.error('Dokploy error startCompose:', error?.response?.data || error.message);
    throw new Error('Failed to start compose');
  }
};

// ─────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────

export const createApplication = async (projectId: string, environmentId: string, name: string, description: string = '') => {
  try {
    const { data } = await dokployApi.post('/application.create', { json: { projectId, environmentId, name, description } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error createApplication:', error?.response?.data || error.message);
    throw new Error('Failed to create application');
  }
};

export const deleteApplication = async (applicationId: string) => {
  try {
    const { data } = await dokployRestApi.post('/application.delete', { applicationId });
    return data;
  } catch (error: any) {
    console.error('Dokploy error deleteApplication:', error?.response?.data || error.message);
    throw new Error('Failed to delete application');
  }
};

export const deployApplication = async (applicationId: string) => {
  try {
    const { data } = await dokployApi.post('/application.deploy', { json: { applicationId } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error deployApplication:', error?.response?.data || error.message);
    throw new Error('Failed to deploy application');
  }
};

export const redeployApplication = async (applicationId: string) => {
  try {
    const { data } = await dokployApi.post('/application.redeploy', { json: { applicationId } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error redeployApplication:', error?.response?.data || error.message);
    throw new Error('Failed to redeploy application');
  }
};

export const stopApplication = async (applicationId: string) => {
  try {
    const { data } = await dokployApi.post('/application.stop', { json: { applicationId } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error stopApplication:', error?.response?.data || error.message);
    throw new Error('Failed to stop application');
  }
};

export const startApplication = async (applicationId: string) => {
  try {
    const { data } = await dokployApi.post('/application.start', { json: { applicationId } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error startApplication:', error?.response?.data || error.message);
    throw new Error('Failed to start application');
  }
};

export const updateApplication = async (applicationId: string, settings: Record<string, any>) => {
  try {
    const { data } = await dokployApi.post('/application.update', { json: { applicationId, ...settings } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error updateApplication:', error?.response?.data || error.message);
    throw new Error('Failed to update application settings');
  }
};

// ─────────────────────────────────────────────
// GITHUB
// ─────────────────────────────────────────────

export const getGithubProviders = async () => {
  try {
    const { data } = await dokployApi.get('/github.githubProviders');
    return data?.result?.data?.json || [];
  } catch (error: any) {
    console.error('Dokploy error githubProviders:', error?.response?.data || error.message);
    return [];
  }
};

export const getGithubRepositories = async () => {
  try {
    const providers = await getGithubProviders();
    if (!providers.length) return [];
    const githubId = providers[0].githubId;
    const inputPayload = JSON.stringify({ json: { githubId } });
    const { data } = await dokployApi.get('/github.getGithubRepositories', {
      params: { input: inputPayload }
    });
    return data?.result?.data?.json || [];
  } catch (error: any) {
    console.error('Dokploy error getGithubRepositories:', error?.response?.data || error.message);
    return [];
  }
};

export const getGithubBranches = async (repository: string) => {
  try {
    const providers = await getGithubProviders();
    if (!providers.length) return [];
    const githubId = providers[0].githubId;
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) return [];
    const inputPayload = JSON.stringify({ json: { githubId, owner, repo } });
    const { data } = await dokployApi.get('/github.getGithubBranches', {
      params: { input: inputPayload }
    });
    return data?.result?.data?.json || [];
  } catch (error: any) {
    console.error('Dokploy error getGithubBranches:', error?.response?.data || error.message);
    return [];
  }
};

export const saveGithubProvider = async (
  applicationId: string,
  repository: string,
  branch: string,
  buildType: string,
  buildPath: string = '/'
) => {
  try {
    const providers = await getGithubProviders();
    if (!providers.length) throw new Error('No GitHub providers connected');
    const githubId = providers[0].githubId;
    const [owner, repoName] = repository.split('/');
    const { data } = await dokployApi.post('/application.saveGithubProvider', {
      json: { applicationId, githubId, owner, repository: repoName, branch, buildPath, buildType }
    });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error saveGithubProvider:', error?.response?.data || error.message);
    throw new Error('Failed to save GitHub provider');
  }
};

// ─────────────────────────────────────────────
// ENVIRONMENT
// ─────────────────────────────────────────────

export const saveEnv = async (applicationId: string, env: string) => {
  try {
    const { data } = await dokployApi.post('/application.saveEnv', { json: { applicationId, env } });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error saveEnv:', error?.response?.data || error.message);
    throw new Error('Failed to save environment variables');
  }
};

// ─────────────────────────────────────────────
// DEPLOYMENTS & LOGS
// ─────────────────────────────────────────────

export const getDeployments = async (applicationId: string) => {
  try {
    const inputPayload = JSON.stringify({ json: { applicationId } });
    const { data } = await dokployApi.get('/deployment.all', {
      params: { input: inputPayload }
    });
    return data?.result?.data?.json || [];
  } catch (error: any) {
    // This endpoint may return 401 depending on API key permissions
    console.error('Dokploy error getDeployments:', error?.response?.data?.error?.json?.message || error.message);
    return [];
  }
};

export const getLogs = async (applicationId: string) => {
  try {
    // First try to get deployments for this application
    const deployments = await getDeployments(applicationId);
    if (!deployments || deployments.length === 0) {
      return [];
    }
    const latestDeployment = deployments[0];
    const deploymentId = latestDeployment.deploymentId;
    return getDeploymentLogs(deploymentId);
  } catch (error: any) {
    console.error('Dokploy error getLogs:', error?.response?.data || error.message);
    return [];
  }
};

export const getDeploymentLogs = async (deploymentId: string) => {
  try {
    const logInput = JSON.stringify({ json: { deploymentId } });
    const logRes = await dokployApi.get('/deployment.readLogs', {
      params: { input: logInput }
    });
    const rawLogs = logRes.data?.result?.data?.json;
    if (typeof rawLogs !== 'string') return '';
    return rawLogs;
  } catch (error: any) {
    console.error('Dokploy error getDeploymentLogs:', error?.response?.data || error.message);
    return '';
  }
};

export const getRuntimeLogs = async (applicationId: string) => {
  try {
    const logInput = JSON.stringify({ json: { applicationId } });
    const logRes = await dokployApi.get('/application.readLogs', {
      params: { input: logInput }
    });
    const rawLogs = logRes.data?.result?.data?.json;
    if (typeof rawLogs !== 'string') return '';
    return rawLogs;
  } catch (error: any) {
    console.error('Dokploy error getRuntimeLogs:', error?.response?.data || error.message);
    return '';
  }
};

// ─────────────────────────────────────────────
// DOMAINS
// ─────────────────────────────────────────────

export const getDomains = async (applicationId: string) => {
  try {
    const inputPayload = JSON.stringify({ json: { applicationId } });
    const { data } = await dokployApi.get('/domain.byApplicationId', {
      params: { input: inputPayload }
    });
    return data?.result?.data?.json || [];
  } catch (error: any) {
    console.error('Dokploy error getDomains:', error?.response?.data || error.message);
    return [];
  }
};

export const createDomain = async (applicationId: string, payload: any) => {
  try {
    const { data } = await dokployApi.post('/domain.create', {
      json: { 
        applicationId, 
        host: payload.host, 
        https: payload.https !== false, 
        port: payload.port || 80, 
        path: payload.path || '/',
        internalPath: payload.internalPath || '/',
        stripPath: !!payload.stripPath,
        customEntrypoint: payload.customEntrypoint || null,
        certificateType: payload.certificateType || (payload.https !== false ? 'letsencrypt' : 'none'),
        middlewares: payload.middlewares ? payload.middlewares.split(',').map((s: string) => s.trim()).filter(Boolean) : []
      }
    });
    return data?.result?.data?.json;
  } catch (error: any) {
    console.error('Dokploy error createDomain:', error?.response?.data || error.message);
    throw new Error('Failed to create domain');
  }
};

export const deleteDomain = async (domainId: string) => {
  try {
    const { data } = await dokployApi.post('/domain.delete', {
      json: { domainId }
    });
    return data;
  } catch (error: any) {
    console.error('Dokploy error deleteDomain:', error?.response?.data || error.message);
    throw new Error('Failed to delete domain');
  }
};

// ─────────────────────────────────────────────
// DEPLOYMENTS
// ─────────────────────────────────────────────

export const removeDeployment = async (deploymentId: string) => {
  try {
    const { data } = await dokployApi.post('/deployment.removeDeployment', {
      json: { deploymentId }
    });
    return data;
  } catch (error: any) {
    console.error('Dokploy error removeDeployment:', error?.response?.data || error.message);
    throw new Error('Failed to remove deployment');
  }
};

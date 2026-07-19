import { Request, Response } from 'express';
import * as dokployService from '../services/dokployService';

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await dokployService.getProjects();
    res.json(projects);
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const result = await dokployService.createProject(name, description);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    await dokployService.deleteProject(req.params.id as string);
    res.json({ message: 'Project deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
};

// ─────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────

export const createApplication = async (req: Request, res: Response) => {
  const { projectId, environmentId, name, description } = req.body;
  if (!projectId || !environmentId || !name) {
    return res.status(400).json({ error: 'projectId, environmentId, and name are required' });
  }
  try {
    const app = await dokployService.createApplication(projectId, environmentId, name, description);
    res.status(201).json(app);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create application' });
  }
};

export const deleteApplication = async (req: Request, res: Response) => {
  try {
    await dokployService.deleteApplication(req.params.id as string);
    res.json({ message: 'Application deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete application' });
  }
};

export const deployApplication = async (req: Request, res: Response) => {
  const { applicationId } = req.body;
  if (!applicationId) return res.status(400).json({ error: 'applicationId is required' });
  try {
    await dokployService.deployApplication(applicationId);
    res.json({ message: 'Deployment started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Deployment failed' });
  }
};

export const redeployApplication = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await dokployService.redeployApplication(id);
    res.json({ message: 'Redeploy started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Redeploy failed' });
  }
};

export const stopApplication = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await dokployService.stopApplication(id);
    res.json({ message: 'Application stopped' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to stop application' });
  }
};

export const startApplication = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await dokployService.startApplication(id);
    res.json({ message: 'Application started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start application' });
  }
};

export const updateApplicationSettings = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const settings = req.body;
  try {
    await dokployService.updateApplication(id, settings);
    res.json({ message: 'Settings updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
};

export const saveProvider = async (req: Request, res: Response) => {
  const applicationId = req.params.applicationId as string;
  const { repository, branch, buildType, buildPath } = req.body;
  
  if (!repository || !branch) {
    return res.status(400).json({ error: 'Repository and branch are required' });
  }

  try {
    await dokployService.saveGithubProvider(applicationId, repository, branch, buildType, buildPath);
    res.json({ message: 'Provider saved' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save provider' });
  }
};

export const saveEnv = async (req: Request, res: Response) => {
  const applicationId = req.params.applicationId as string;
  const { env } = req.body;
  try {
    await dokployService.saveEnv(applicationId, env || '');
    res.json({ message: 'Environment variables saved' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save environment variables' });
  }
};

// ─────────────────────────────────────────────
// DEPLOYMENTS & LOGS
// ─────────────────────────────────────────────

export const getDeployments = async (req: Request, res: Response) => {
  try {
    const deployments = await dokployService.getDeployments(req.params.id as string);
    res.json(deployments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
};

export const getLogs = async (req: Request, res: Response) => {
  try {
    const logs = await dokployService.getLogs(req.params.id as string);
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

export const getRuntimeLogs = async (req: Request, res: Response) => {
  try {
    const logs = await dokployService.getRuntimeLogs(req.params.id as string);
    res.type('text/plain').send(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch runtime logs' });
  }
};

export const getDeploymentLogs = async (req: Request, res: Response) => {
  try {
    const logs = await dokployService.getDeploymentLogs(req.params.deploymentId as string);
    res.type('text/plain').send(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch deployment logs' });
  }
};

// ─────────────────────────────────────────────
// GITHUB
// ─────────────────────────────────────────────

export const getGithubStatus = async (req: Request, res: Response) => {
  try {
    const providers = await dokployService.getGithubProviders();
    res.json({ connected: providers.length > 0, providers });
  } catch {
    res.json({ connected: false, providers: [] });
  }
};

export const getRepositories = async (req: Request, res: Response) => {
  try {
    const repos = await dokployService.getGithubRepositories();
    res.json(repos);
  } catch {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
};

export const getBranches = async (req: Request, res: Response) => {
  const repository = req.query.repository as string;
  if (!repository) return res.status(400).json({ error: 'repository query param required' });
  try {
    const branches = await dokployService.getGithubBranches(repository);
    res.json(branches);
  } catch {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

// ─────────────────────────────────────────────
// DOMAINS
// ─────────────────────────────────────────────

export const getDomains = async (req: Request, res: Response) => {
  try {
    const domains = await dokployService.getDomains(req.params.id as string);
    res.json(domains);
  } catch {
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
};

export const createDomain = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { host, https, port } = req.body;
  try {
    const domain = await dokployService.createDomain(id, host, https, port);
    res.status(201).json(domain);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create domain' });
  }
};

export const deleteDomain = async (req: Request, res: Response) => {
  try {
    await dokployService.deleteDomain(req.params.domainId as string);
    res.json({ message: 'Domain deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete domain' });
  }
};

// ─────────────────────────────────────────────
// LEGACY COMPAT (keep old route handler names)
// ─────────────────────────────────────────────
export const deployProject = deployApplication;
export const getStatus = async (req: Request, res: Response) => res.json({ status: 'unknown' });

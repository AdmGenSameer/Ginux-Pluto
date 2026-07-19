import { Router } from 'express';
import * as c from '../controllers/projectController';

const router = Router();

// ── Projects ──────────────────────────────────────
router.get('/projects', c.getProjects);
router.post('/projects', c.createProject);
router.delete('/projects/:id', c.deleteProject);

// ── Applications ──────────────────────────────────
router.post('/applications', c.createApplication);
router.delete('/applications/:id', c.deleteApplication);
router.post('/applications/:id/deploy', c.deployApplication);
router.post('/applications/:id/redeploy', c.redeployApplication);
router.post('/applications/:id/stop', c.stopApplication);
router.post('/applications/:id/start', c.startApplication);
router.put('/applications/:id/settings', c.updateApplicationSettings);

// ── GitHub Provider / Env ─────────────────────────
router.post('/applications/:applicationId/provider', c.saveProvider);
router.post('/applications/:applicationId/env', c.saveEnv);

// ── Deployments & Logs ───────────────────────────
router.get('/applications/:id/deployments', c.getDeployments);
router.get('/applications/:id/logs', c.getLogs); // Legacy
router.get('/applications/:id/runtime-logs', c.getRuntimeLogs);
router.get('/deployments/:deploymentId/logs', c.getDeploymentLogs);

// ── Domains ───────────────────────────────────────
router.get('/applications/:id/domains', c.getDomains);
router.post('/applications/:id/domains', c.createDomain);
router.delete('/domains/:domainId', c.deleteDomain);

// ── GitHub ────────────────────────────────────────
router.get('/github/status', c.getGithubStatus);
router.get('/repositories', c.getRepositories);
router.get('/branches', c.getBranches);

// ── Legacy ────────────────────────────────────────
router.post('/deploy', c.deployProject);
router.get('/status/:id', c.getStatus);
router.get('/logs/:id', c.getLogs);

export default router;

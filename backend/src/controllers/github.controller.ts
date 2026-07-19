import { Request, Response } from 'express';
import * as githubManifestService from '../services/githubManifest';

export const connectGithub = async (req: Request, res: Response) => {
  try {
    const result = await githubManifestService.generateGithubManifest();
    res.json(result);
  } catch (error: any) {
    console.error('Error generating GitHub manifest:', error);
    res.status(500).json({ error: 'Failed to generate GitHub manifest' });
  }
};

export const getProviders = async (req: Request, res: Response) => {
  try {
    const providers = await githubManifestService.getGithubProviders();
    res.json(providers || []);
  } catch (error: any) {
    console.error('Error fetching GitHub providers:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub providers' });
  }
};

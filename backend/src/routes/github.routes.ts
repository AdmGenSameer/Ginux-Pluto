import { Router } from 'express';
import { connectGithub, getProviders } from '../controllers/github.controller';

const router = Router();

router.get('/connect', connectGithub);
router.get('/providers', getProviders);

export default router;

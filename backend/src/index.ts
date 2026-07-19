import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projectRoutes';
import githubRoutes from './routes/github.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', projectRoutes);
app.use('/api/github', githubRoutes);

// Simple Login Mock
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({ token: 'mock-jwt-token-12345' });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

app.listen(port, () => {
  console.log(`CloudDeploy Backend API Gateway listening at http://localhost:${port}`);
  console.log(`Connected to Dokploy at: ${process.env.DOKPLOY_URL || 'http://localhost:3000'}`);
});

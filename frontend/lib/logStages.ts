import { ParsedLine } from '../components/logs/ansiParser';

export interface DeploymentStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration?: string;
  startIndex?: number;
  endIndex?: number;
}

export function parseStages(logs: ParsedLine[]): DeploymentStage[] {
  // A heuristic based stage parser for typical deployment pipelines
  const stages: DeploymentStage[] = [
    { id: 'clone', name: 'Clone Repository', status: 'pending' },
    { id: 'install', name: 'Install Dependencies', status: 'pending' },
    { id: 'build', name: 'Build Application', status: 'pending' },
    { id: 'docker', name: 'Build Docker Image', status: 'pending' },
    { id: 'push', name: 'Push Image', status: 'pending' },
    { id: 'start', name: 'Start Container', status: 'pending' },
    { id: 'health', name: 'Health Check', status: 'pending' },
  ];

  let currentStageIndex = -1;

  const setStageStart = (index: number, lineIndex: number) => {
    if (currentStageIndex >= 0 && currentStageIndex < stages.length) {
      if (stages[currentStageIndex].status === 'running') {
        stages[currentStageIndex].status = 'done';
        stages[currentStageIndex].endIndex = lineIndex;
      }
    }
    currentStageIndex = index;
    stages[index].status = 'running';
    stages[index].startIndex = lineIndex;
  };

  for (let i = 0; i < logs.length; i++) {
    const text = logs[i].rawText.toLowerCase();

    // Heuristics for stage transitions
    if (text.includes('cloning repository') || text.includes('fetch') && currentStageIndex < 0) {
      setStageStart(0, i);
    } 
    else if (text.includes('installing dependencies') || text.includes('npm install') || text.includes('yarn install') || text.includes('pnpm install')) {
      if (currentStageIndex < 1) setStageStart(1, i);
    } 
    else if (text.includes('building application') || text.includes('npm run build') || text.includes('[nixpacks] building')) {
      if (currentStageIndex < 2) setStageStart(2, i);
    } 
    else if (text.includes('building docker image') || text.includes('step 1/') || text.includes('docker build')) {
      if (currentStageIndex < 3) setStageStart(3, i);
    } 
    else if (text.includes('pushing image') || text.includes('docker push')) {
      if (currentStageIndex < 4) setStageStart(4, i);
    } 
    else if (text.includes('starting container') || text.includes('container started') || text.includes('creating container')) {
      if (currentStageIndex < 5) setStageStart(5, i);
    } 
    else if (text.includes('health check') || text.includes('checking health')) {
      if (currentStageIndex < 6) setStageStart(6, i);
    }

    if (logs[i].isError && currentStageIndex >= 0) {
      stages[currentStageIndex].status = 'error';
    }
  }

  // Calculate durations
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    if (stage.startIndex !== undefined && stage.endIndex !== undefined) {
      const startLog = logs[stage.startIndex];
      const endLog = logs[stage.endIndex];
      if (startLog?.timestamp && endLog?.timestamp) {
        try {
          const t1 = new Date(startLog.timestamp).getTime();
          const t2 = new Date(endLog.timestamp).getTime();
          const diffSec = Math.round((t2 - t1) / 1000);
          if (diffSec < 60) {
            stage.duration = `${diffSec}s`;
          } else {
            stage.duration = `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
          }
        } catch {}
      }
    } else if (stage.status === 'running' && stage.startIndex !== undefined) {
      // Still running, calculate duration up to last log
      const startLog = logs[stage.startIndex];
      const endLog = logs[logs.length - 1];
      if (startLog?.timestamp && endLog?.timestamp) {
        try {
          const t1 = new Date(startLog.timestamp).getTime();
          const t2 = new Date(endLog.timestamp).getTime();
          const diffSec = Math.max(0, Math.round((t2 - t1) / 1000));
          if (diffSec < 60) {
            stage.duration = `${diffSec}s`;
          } else {
            stage.duration = `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
          }
        } catch {}
      }
    }
  }

  return stages;
}

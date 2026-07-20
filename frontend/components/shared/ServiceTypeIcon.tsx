import { cn } from '@/lib/utils';
import {
  Globe, Server, Database, Zap, Clock, Radio, Container,
  Box, Layers, Coffee, GitFork, Cpu, HardDrive, Workflow,
  MessageSquare, Braces, FileCode,
} from 'lucide-react';

const typeMap: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  frontend:    { icon: Globe,         color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Frontend'   },
  backend:     { icon: Server,        color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Backend'    },
  api:         { icon: Braces,        color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'API'        },
  database:    { icon: Database,      color: 'text-emerald-400',bg: 'bg-emerald-500/10',label: 'Database'   },
  postgres:    { icon: Database,      color: 'text-sky-400',    bg: 'bg-sky-500/10',    label: 'PostgreSQL' },
  mysql:       { icon: Database,      color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'MySQL'      },
  mongodb:     { icon: Database,      color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'MongoDB'    },
  redis:       { icon: Zap,           color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Redis'      },
  worker:      { icon: Cpu,           color: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Worker'     },
  cron:        { icon: Clock,         color: 'text-pink-400',   bg: 'bg-pink-500/10',   label: 'Cron'       },
  queue:       { icon: Workflow,      color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Queue'      },
  websocket:   { icon: Radio,         color: 'text-teal-400',   bg: 'bg-teal-500/10',   label: 'WebSocket'  },
  static:      { icon: FileCode,      color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   label: 'Static'     },
  docker:      { icon: Container,     color: 'text-blue-300',   bg: 'bg-blue-400/10',   label: 'Docker'     },
  java:        { icon: Coffee,        color: 'text-orange-300', bg: 'bg-orange-400/10', label: 'Java'       },
  compose:     { icon: Layers,        color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Compose'    },
  minio:       { icon: HardDrive,     color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'MinIO'      },
  rabbitmq:    { icon: MessageSquare, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'RabbitMQ'   },
  kafka:       { icon: GitFork,       color: 'text-zinc-300',   bg: 'bg-zinc-500/10',   label: 'Kafka'      },
  default:     { icon: Box,           color: 'text-zinc-400',   bg: 'bg-zinc-500/10',   label: 'Service'    },
};

function detectType(name: string, buildType?: string): string {
  const n = name.toLowerCase();
  if (n.includes('front') || n.includes('web') || n.includes('ui') || n.includes('next') || n.includes('react') || n.includes('vue'))
    return 'frontend';
  if (n.includes('redis') || n.includes('cache')) return 'redis';
  if (n.includes('postgres') || n.includes('pg')) return 'postgres';
  if (n.includes('mysql') || n.includes('mariadb')) return 'mysql';
  if (n.includes('mongo')) return 'mongodb';
  if (n.includes('cron')) return 'cron';
  if (n.includes('worker')) return 'worker';
  if (n.includes('queue') || n.includes('rabbit') || n.includes('kafka')) return 'queue';
  if (n.includes('socket') || n.includes('ws')) return 'websocket';
  if (n.includes('api') || n.includes('back') || n.includes('server') || n.includes('express') || n.includes('fastapi'))
    return 'api';
  if (buildType === 'dockerfile') return 'docker';
  if (buildType === 'static') return 'static';
  return 'default';
}

interface ServiceTypeIconProps {
  name: string;
  buildType?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  forceType?: string;
}

export function ServiceTypeIcon({
  name,
  buildType,
  size = 'md',
  className,
  showLabel = false,
  forceType,
}: ServiceTypeIconProps) {
  const type = forceType ?? detectType(name, buildType);
  const config = typeMap[type] ?? typeMap.default;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };
  const iconSizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex flex-shrink-0 items-center justify-center rounded-lg', sizeClasses[size], config.bg)}>
        <Icon className={cn(iconSizes[size], config.color)} />
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
      )}
    </div>
  );
}

export { detectType, typeMap };

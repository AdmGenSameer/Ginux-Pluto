import { useState, useEffect, useRef, useCallback } from 'react';
import { ParsedLine, processLogLine } from '../components/logs/ansiParser';
import { LogTransport, PollingTransport } from '../lib/logTransport';

interface UseLogsOptions {
  endpointUrl: string | null;
  enabled?: boolean;
  transport?: LogTransport;
}

export function useLogs({
  endpointUrl,
  enabled = true,
  transport = new PollingTransport(), // Default to Polling
}: UseLogsOptions) {
  const [logs, setLogs] = useState<ParsedLine[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const linesCountRef = useRef(0);
  const transportRef = useRef<LogTransport>(transport);

  // Subscribe to transport
  useEffect(() => {
    if (!endpointUrl) return;

    transportRef.current.subscribe(
      endpointUrl,
      (newContent) => {
        const newLines = newContent.split('\n');
        if (newLines[newLines.length - 1] === '') {
          newLines.pop();
        }
        
        const parsedLines = newLines.map((line) => {
          const parsed = processLogLine(line, linesCountRef.current);
          linesCountRef.current += 1;
          return parsed;
        });

        if (parsedLines.length > 0) {
          setLogs((prev) => [...prev, ...parsedLines]);
        }
        setError(null);
      },
      () => {
        linesCountRef.current = 0;
        setLogs([]);
      },
      (err) => {
        setError(err.message);
        setIsLive(false);
      }
    );
  }, [endpointUrl]);

  // Handle connection lifecycle
  useEffect(() => {
    if (!endpointUrl || !enabled || !isLive) {
      transportRef.current.disconnect();
      return;
    }

    transportRef.current.connect();

    return () => {
      transportRef.current.disconnect();
    };
  }, [endpointUrl, enabled, isLive]);

  // Handle initial fetch state
  useEffect(() => {
    setError(null);
    if (endpointUrl && enabled) {
      setIsLive(true);
    } else {
      setIsLive(false);
    }
  }, [endpointUrl, enabled]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    linesCountRef.current = 0;
  }, []);

  return {
    logs,
    isLive,
    setIsLive,
    error,
    clearLogs,
  };
}

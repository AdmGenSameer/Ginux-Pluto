export interface ParsedSegment {
  text: string;
  className: string;
}

export interface ParsedLine {
  id: string;
  rawText: string;
  segments: ParsedSegment[];
  isError: boolean;
  isWarning: boolean;
  isSuccess: boolean;
  detectedErrorType?: string;
  timestamp?: string;
}

const ANSI_REGEX = /\u001b\[([0-9;]*)m/g;

const COMMON_ERRORS = [
  { pattern: /npm err!/i, type: 'npm Error' },
  { pattern: /module not found/i, type: 'Missing Module' },
  { pattern: /docker build failed/i, type: 'Docker Build Failed' },
  { pattern: /out of memory/i, type: 'OOM' },
  { pattern: /port already in use/i, type: 'Port Conflict' },
  { pattern: /permission denied/i, type: 'Permission Denied' },
  { pattern: /exit code [^0]/i, type: 'Exit Code' },
  { pattern: /error:/i, type: 'Generic Error' }
];

export function parseAnsi(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let lastIndex = 0;
  let match;
  
  // Default color classes
  let currentClass = 'text-zinc-300';

  ANSI_REGEX.lastIndex = 0;

  while ((match = ANSI_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        className: currentClass
      });
    }

    const codes = match[1] ? match[1].split(';') : ['0'];
    for (const code of codes) {
      const c = parseInt(code, 10);
      if (c === 0) currentClass = 'text-zinc-300';
      else if (c === 1) currentClass += ' font-bold';
      else if (c === 30) currentClass = 'text-zinc-500'; // black
      else if (c === 31) currentClass = 'text-red-400'; // red
      else if (c === 32) currentClass = 'text-green-400'; // green
      else if (c === 33) currentClass = 'text-yellow-400'; // yellow
      else if (c === 34) currentClass = 'text-blue-400'; // blue
      else if (c === 35) currentClass = 'text-fuchsia-400'; // magenta
      else if (c === 36) currentClass = 'text-cyan-400'; // cyan
      else if (c === 37) currentClass = 'text-zinc-200'; // white
      else if (c === 90) currentClass = 'text-zinc-400'; // bright black
      else if (c === 91) currentClass = 'text-red-300'; // bright red
      else if (c === 92) currentClass = 'text-green-300'; // bright green
      else if (c === 93) currentClass = 'text-yellow-300'; // bright yellow
      else if (c === 94) currentClass = 'text-blue-300'; // bright blue
      else if (c === 95) currentClass = 'text-fuchsia-300'; // bright magenta
      else if (c === 96) currentClass = 'text-cyan-300'; // bright cyan
      else if (c === 97) currentClass = 'text-white'; // bright white
    }
    
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      className: currentClass
    });
  }

  // If no ANSI codes, return plain string
  if (segments.length === 0) {
    return [{ text, className: 'text-zinc-300' }];
  }

  return segments.filter(s => s.text.length > 0);
}

export function processLogLine(line: string, index: number): ParsedLine {
  // Strip timestamps if they exist (usually Dokploy / docker adds ISO timestamps at the beginning)
  // e.g., "2024-05-18T10:00:00Z  actual log"
  let timestamp: string | undefined = undefined;
  let rawText = line;
  
  const tsMatch = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s*(.*)/.exec(rawText);
  if (tsMatch) {
    timestamp = tsMatch[1];
    rawText = tsMatch[2];
  }

  // strip ansi for error checking
  const cleanText = rawText.replace(ANSI_REGEX, '');
  
  const isError = /error/i.test(cleanText) || /fail/i.test(cleanText) || /err!/i.test(cleanText);
  const isWarning = /warn/i.test(cleanText);
  const isSuccess = /success/i.test(cleanText) || /done/i.test(cleanText);

  let detectedErrorType: string | undefined = undefined;
  if (isError) {
    for (const err of COMMON_ERRORS) {
      if (err.pattern.test(cleanText)) {
        detectedErrorType = err.type;
        break;
      }
    }
  }

  return {
    id: `log-${index}`,
    rawText: cleanText,
    segments: parseAnsi(rawText),
    isError,
    isWarning,
    isSuccess,
    detectedErrorType,
    timestamp
  };
}

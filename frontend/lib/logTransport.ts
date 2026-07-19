import api from '@/services/api';

export interface LogTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(
    endpointUrl: string, 
    onData: (newRawLogs: string) => void, 
    onReset: () => void,
    onError: (err: Error) => void
  ): void;
}

export class PollingTransport implements LogTransport {
  private endpointUrl: string | null = null;
  private pollIntervalMs: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onResetCallback: (() => void) | null = null;
  private onErrorCallback: ((err: Error) => void) | null = null;
  private isConnected = false;
  private prevRawLength = 0;

  constructor(pollIntervalMs: number = 2000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  subscribe(
    endpointUrl: string,
    onData: (data: string) => void,
    onReset: () => void,
    onError: (err: Error) => void
  ) {
    if (this.endpointUrl !== endpointUrl) {
      this.prevRawLength = 0;
      onReset();
    }
    this.endpointUrl = endpointUrl;
    this.onDataCallback = onData;
    this.onResetCallback = onReset;
    this.onErrorCallback = onError;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    this.isConnected = true;
    this.poll();
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private async poll() {
    if (!this.isConnected || !this.endpointUrl) return;

    try {
      const { data } = await api.get(this.endpointUrl);
      const rawLogs = typeof data === 'string' ? data : '';

      if (rawLogs.length < this.prevRawLength) {
        // Logs were truncated or cleared on the server
        this.prevRawLength = 0;
        if (this.onResetCallback) this.onResetCallback();
      }

      const newContent = rawLogs.substring(this.prevRawLength);
      if (newContent.length > 0 && this.onDataCallback) {
        this.onDataCallback(newContent);
        this.prevRawLength = rawLogs.length;
      }
    } catch (err: any) {
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error(err.message || 'Failed to fetch logs'));
      }
    } finally {
      if (this.isConnected) {
        this.timeoutId = setTimeout(() => this.poll(), this.pollIntervalMs);
      }
    }
  }
}

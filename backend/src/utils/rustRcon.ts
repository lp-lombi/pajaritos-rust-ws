type RustRconConfig = {
  host: string;
  port: number;
  password: string;
  reconnectMs?: number;
  maxChatMessages?: number;
  commandTimeoutMs?: number;
};

export type RustChatMessage = {
  user: string;
  message: string;
  createdAt: string;
};

export type RustRconCommandResponse = {
  identifier: number;
  type?: string;
  message?: string;
  raw: any;
};

type PendingCommand = {
  resolve: (value: RustRconCommandResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

const WebSocketImpl = require('ws');

export class RustRcon {
  private ws: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly host: string;
  private readonly port: number;
  private readonly password: string;
  private readonly reconnectMs: number;
  private readonly maxChatMessages: number;
  private readonly commandTimeoutMs: number;
  private nextIdentifier = 1000;
  private pendingCommands = new Map<number, PendingCommand>();

  playerCount = 0;
  playersList: string[] = [];
  connected = false;
  chatMessages: RustChatMessage[] = [];

  constructor(config: RustRconConfig) {
    this.host = config.host;
    this.port = config.port;
    this.password = config.password;
    this.reconnectMs = config.reconnectMs ?? 5000;
    this.maxChatMessages = config.maxChatMessages ?? 200;
    this.commandTimeoutMs = config.commandTimeoutMs ?? 4000;
  }

  connect() {
    if (!this.password) {
      console.warn('RCON_PASSWORD no configurado. RCON deshabilitado.');
      return;
    }

    this.ws = new WebSocketImpl(`ws://${this.host}:${this.port}/${this.password}`);

    this.ws.on('open', () => {
      this.connected = true;
      this.updateData();
    });

    this.ws.on('message', (raw: any) => {
      const rawData = typeof raw === 'string' ? raw : raw?.toString?.();
      if (!rawData) return;

      try {
        const payload = JSON.parse(rawData);
        this.resolvePendingCommand(payload);

        if (payload?.Identifier === 1 && typeof payload?.Message === 'string') {
          this.parseStatus(payload.Message);
        }

        if (payload?.Type === 'Chat' && typeof payload?.Message === 'string') {
          const chatPayload = JSON.parse(payload.Message);
          const user = typeof chatPayload?.Username === 'string' ? chatPayload.Username : 'Unknown';
          const message = typeof chatPayload?.Message === 'string' ? chatPayload.Message : '';

          if (message) {
            this.chatMessages.push({
              user,
              message,
              createdAt: new Date().toISOString(),
            });

            if (this.chatMessages.length > this.maxChatMessages) {
              this.chatMessages.splice(0, this.chatMessages.length - this.maxChatMessages);
            }
          }
        }
      } catch {
        // Ignoramos payloads no JSON o formatos no esperados.
      }
    });

    this.ws.on('close', () => {
      this.connected = false;
      this.ws = null;
      this.rejectAllPendingCommands('RCON connection closed');

      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, this.reconnectMs);
      }
    });

    this.ws.on('error', () => {
      this.connected = false;
      this.rejectAllPendingCommands('RCON connection error');
    });
  }

  updateData() {
    if (!this.connected || !this.ws) return;

    this.ws.send(JSON.stringify({ Identifier: 1, Message: 'status', Name: 'BackendApi' }));
  }

  sendCommand(cmd: string): boolean;
  sendCommand(cmd: string, waitForResponse: true, timeoutMs?: number): Promise<RustRconCommandResponse>;
  sendCommand(cmd: string, waitForResponse = false, timeoutMs = this.commandTimeoutMs) {
    if (!this.connected || !this.ws) return false;

    const identifier = this.getNextIdentifier();

    if (!waitForResponse) {
      this.ws.send(JSON.stringify({ Identifier: identifier, Message: cmd, Name: 'BackendApi' }));
      return true;
    }

    return new Promise<RustRconCommandResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(identifier);
        reject(new Error(`Timeout waiting RCON response for Identifier ${identifier}`));
      }, timeoutMs);

      this.pendingCommands.set(identifier, { resolve, reject, timeout });

      try {
        this.ws.send(JSON.stringify({ Identifier: identifier, Message: cmd, Name: 'BackendApi' }));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingCommands.delete(identifier);
        reject(error instanceof Error ? error : new Error('Error sending RCON command'));
      }
    });
  }

  private getNextIdentifier() {
    this.nextIdentifier += 1;

    if (this.nextIdentifier >= Number.MAX_SAFE_INTEGER) {
      this.nextIdentifier = 1000;
    }

    return this.nextIdentifier;
  }

  private resolvePendingCommand(payload: any) {
    const identifier = Number(payload?.Identifier);

    if (!Number.isFinite(identifier)) {
      return;
    }

    const pending = this.pendingCommands.get(identifier);

    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingCommands.delete(identifier);
    pending.resolve({
      identifier,
      type: typeof payload?.Type === 'string' ? payload.Type : undefined,
      message: typeof payload?.Message === 'string' ? payload.Message : undefined,
      raw: payload,
    });
  }

  private rejectAllPendingCommands(reason: string) {
    if (this.pendingCommands.size === 0) {
      return;
    }

    const error = new Error(reason);

    for (const pending of this.pendingCommands.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }

    this.pendingCommands.clear();
  }

  private parseStatus(message: string) {
    const regex = /(\d+)\s+"([^"]+)"\s+(\d+)\s+([\d.]+s)/g;
    let match: RegExpExecArray | null;
    let count = 0;
    const list: string[] = [];

    while ((match = regex.exec(message)) !== null) {
      count++;
      list.push(`${match[2]} (${match[3]} ms)`);
    }

    this.playerCount = count;
    this.playersList = list;
  }
}

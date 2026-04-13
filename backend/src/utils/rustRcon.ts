type RustRconConfig = {
  host: string;
  port: number;
  password: string;
  reconnectMs?: number;
  maxChatMessages?: number;
};

export type RustChatMessage = {
  user: string;
  message: string;
  createdAt: string;
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

      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, this.reconnectMs);
      }
    });

    this.ws.on('error', () => {
      this.connected = false;
    });
  }

  updateData() {
    if (!this.connected || !this.ws) return;

    this.ws.send(JSON.stringify({ Identifier: 1, Message: 'status', Name: 'BackendApi' }));
  }

  sendCommand(cmd: string) {
    if (!this.connected || !this.ws) return false;

    this.ws.send(JSON.stringify({ Identifier: 100, Message: cmd, Name: 'BackendApi' }));
    return true;
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

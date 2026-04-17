export interface RustPlayer {
    steamId: string;
    displayName: string;
    ping: number;
    ip: string;
    entityId: number;
    connectedSeconds: number;
    health: number;
    position: {
        x: number;
        y: number;
    };
}

export class CommandsParser {

    /**
     * Parsea la salida del comando "playerlist" y devuelve una lista de objetos Player.
     */
    static parsePlayersList(output: string): Player[] {
        const players: Player[] = [];
        const parsed = JSON.parse(output);
        if (Array.isArray(parsed)) {
            for (const p of parsed) {
                players.push({
                    steamId: p.SteamID,
                    displayName: p.DisplayName,
                    ping: p.Ping,
                    ip: p.Address,
                    entityId: p.EntityId,
                    connectedSeconds: p.ConnectedSeconds,
                    health: p.Health,
                    position: {
                        x: p.Position.x,
                        y: p.Position.y,
                    },
                });
            }
        }
        return players;
    }
}
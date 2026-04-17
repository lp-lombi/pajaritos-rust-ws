import { RustPlayer } from "../services/commands-parser";
import { usePlayerRegForm } from "../context/PlayerRegFormContext";
import "./CurrentPlayerDetails.css";

interface CurrentPlayerDetailsProps {
  player: RustPlayer | null;
  onRegister?: (player: RustPlayer) => void;
}

function CurrentPlayerDetails({
  player,
  onRegister,
}: CurrentPlayerDetailsProps) {
  const { openPlayerRegForm } = usePlayerRegForm();

  return (
    <div className="current-player-details">
      <h2>Detalles del jugador</h2>
      {player && (
        <div>
          <h3>{player.displayName}</h3>
          <div className="current-player-details-field">
            <strong>SteamID:</strong>
            <span>{player.steamId}</span>
          </div>
          <div className="current-player-details-field">
            <strong>Ping:</strong>
            <span>{player.ping} ms</span>
          </div>
          <div className="current-player-details-field">
            <strong>IP:</strong>
            <span>{player.ip}</span>
          </div>
          <div className="current-player-details-field">
            <strong>ID de entidad:</strong>
            <span>{player.entityId}</span>
          </div>
          <div className="current-player-details-field">
            <strong>Tiempo de conexión:</strong>
            <span>{Math.round(player.connectedSeconds / 60)} minutos</span>
          </div>
          <div className="current-player-details-actions">
            <button onClick={() => {}}>Kickear</button>
            <button
              onClick={() => {
                if (onRegister) {
                  onRegister(player);
                  return;
                }

                openPlayerRegForm({
                  steamid: player.steamId,
                  tag: player.displayName,
                  loadSubscription: false,
                });
              }}
            >
              Registrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrentPlayerDetails;

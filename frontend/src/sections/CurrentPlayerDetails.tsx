import { useEffect, useState } from "react";
import { RustPlayer } from "../services/commands-parser";
import { usePlayerRegForm } from "../context/PlayerRegFormContext";
import "./CurrentPlayerDetails.css";
import { useRustConsole } from "../context/RustConsoleContext";
import { getSteamProfile } from "../services/http-client";

const DEFAULT_STEAM_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='18' fill='%231b2838'/%3E%3Ccircle cx='48' cy='38' r='18' fill='%23314d63'/%3E%3Cpath d='M20 82c5-15 18-22 28-22s23 7 28 22' fill='%23314d63'/%3E%3C/svg%3E";

interface CurrentPlayerDetailsProps {
  player: RustPlayer | null;
  onRegister?: (player: RustPlayer) => void;
}

function CurrentPlayerDetails({
  player,
  onRegister,
}: CurrentPlayerDetailsProps) {
  const { openPlayerRegForm } = usePlayerRegForm();
  const { executeCommand } = useRustConsole();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSteamProfile() {
      if (!player?.steamId) {
        setAvatarUrl(null);
        return;
      }

      try {
        const profile = await getSteamProfile(player.steamId);

        if (isMounted) {
          setAvatarUrl(
            profile.avatarFull ?? profile.avatarMedium ?? profile.avatarIcon,
          );
        }
      } catch {
        if (isMounted) {
          setAvatarUrl(null);
        }
      }
    }

    void loadSteamProfile();

    return () => {
      isMounted = false;
    };
  }, [player?.steamId]);

  return (
    <div className="current-player-details">
      <h2>Detalles del jugador</h2>
      {player && (
        <div>
          <div className="current-player-avatar-wrap">
            <img
              className="current-player-avatar"
              src={avatarUrl ?? DEFAULT_STEAM_AVATAR}
              alt={`Avatar de ${player.displayName}`}
              onError={(event) => {
                event.currentTarget.src = DEFAULT_STEAM_AVATAR;
              }}
            />
          </div>
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
            <button
              onClick={() => {
                executeCommand(
                  `kick ${player.steamId} "Fuiste expulsado del servidor."`,
                );
              }}
            >
              Kickear
            </button>
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

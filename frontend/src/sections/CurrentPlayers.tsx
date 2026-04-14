import React, { useEffect } from "react";
import Container from "../layout/Container";
import ContextMenu from "../components/ContextMenu";

import "./CurrentPlayers.css";

interface PlayerData {
  name: string;
  ping: number;
}

type CurrentPlayersProps = {
  onOpenConsoleWithCommand: (command: string) => void;
};

function CurrentPlayers({ onOpenConsoleWithCommand }: CurrentPlayersProps) {
  const [players, setPlayers] = React.useState<PlayerData[]>([]);
  const [activePlayerName, setActivePlayerName] = React.useState<string | null>(
    null,
  );
  const playerItemRefs = React.useRef<Record<string, HTMLLIElement | null>>({});

  const updatePlayers = async () => {
    try {
      const response = await fetch("/api/rust/players");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data?.players)) {
        const validPlayers: PlayerData[] = data.players
          .map((p: string) => {
            // el ping viene (90 ms). Ej: Pablo (90 ms)
            const match = p.match(/^(.*)\s+\((\d+)\s*ms\)$/);
            if (match) {
              return {
                name: match[1],
                ping: parseInt(match[2], 10),
              };
            }
          })
          .filter(
            (p: PlayerData | undefined): p is PlayerData => p !== undefined,
          );
        setPlayers(validPlayers);
      }
    } catch (error) {
      console.error("Error obteniendo jugadores:", error);
    }
  };

  useEffect(() => {
    updatePlayers();
    const id = setInterval(updatePlayers, 5000);
    return () => clearInterval(id);
  }, []);

  function handleOpenCombatlog(playerName: string) {
    onOpenConsoleWithCommand(`combatlog ${playerName}`);
  }

  return (
    <section className="current-players">
      <Container>
        <h2>Jugadores ({players.length})</h2>
        <ul>
          {players.map((player, index) => (
            <li
              key={`${player.name}-${index}`}
              ref={(element) => {
                playerItemRefs.current[player.name] = element;
              }}
              className="current-player-item"
              onClick={() => {
                setActivePlayerName((prev) =>
                  prev === player.name ? null : player.name,
                );
              }}
            >
              {player.name}

              <ContextMenu
                isOpen={activePlayerName === player.name}
                anchorElement={playerItemRefs.current[player.name] ?? null}
                onClose={() => setActivePlayerName(null)}
                options={[
                  {
                    label: `Combatlog`,
                    onClick: () => {
                      handleOpenCombatlog(player.name);
                    },
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export default CurrentPlayers;

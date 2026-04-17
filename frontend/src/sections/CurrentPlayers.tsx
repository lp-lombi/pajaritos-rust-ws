import React, { useEffect } from "react";
import ContextMenu from "../components/ContextMenu";

import "./CurrentPlayers.css";
import { useRustConsole } from "../context/RustConsoleContext";
import { CommandsParser, RustPlayer } from "../services/commands-parser";
import CurrentPlayerDetails from "./CurrentPlayerDetails";
import FloatingSection from "../layout/FloatingSection";
import { usePlayerRegForm } from "../context/PlayerRegFormContext";

type CurrentPlayersProps = {
  onOpenConsoleWithCommand: (command: string) => void;
};

function CurrentPlayers({ onOpenConsoleWithCommand }: CurrentPlayersProps) {
  const { executeCommand } = useRustConsole();
  const { openPlayerRegForm } = usePlayerRegForm();

  const [players, setPlayers] = React.useState<RustPlayer[]>([]);
  const [activePlayerName, setActivePlayerName] = React.useState<string | null>(
    null,
  );
  const [selectedPlayer, setSelectedPlayer] = React.useState<RustPlayer | null>(
    null,
  );

  const playerItemRefs = React.useRef<Record<string, HTMLLIElement | null>>({});

  const updatePlayers = async () => {
    try {
      const response = await executeCommand("playerlist");
      const output = response.response?.message ?? "[]";
      const parsedPlayers = CommandsParser.parsePlayersList(output);

      setPlayers(parsedPlayers);
    } catch (error) {
      console.error("Error obteniendo jugadores:", error);
    }
  };

  useEffect(() => {
    void updatePlayers();
    const id = window.setInterval(() => {
      void updatePlayers();
    }, 5000);
    return () => window.clearInterval(id);
  }, [executeCommand]);

  function handleOpenCombatlog(playerName: string) {
    onOpenConsoleWithCommand(`combatlog ${playerName}`);
  }

  function handleRegisterPlayer(player: RustPlayer) {
    setSelectedPlayer(null);
    openPlayerRegForm({
      steamid: player.steamId,
      tag: player.displayName,
      loadSubscription: false,
    });
  }

  return (
    <section className="current-players">
      <h2>Jugadores ({players.length})</h2>
      <ul>
        {players.map((player, index) => (
          <li
            key={`${player.displayName}-${index}`}
            ref={(element) => {
              playerItemRefs.current[player.displayName] = element;
            }}
            className="current-player-item"
            onClick={() => {
              setActivePlayerName((prev) =>
                prev === player.displayName ? null : player.displayName,
              );
            }}
          >
            {player.displayName} (Ping: {player.ping}ms, IP: {player.ip})
            <ContextMenu
              isOpen={activePlayerName === player.displayName}
              anchorElement={playerItemRefs.current[player.displayName] ?? null}
              onClose={() => setActivePlayerName(null)}
              options={[
                {
                  label: `Detalles`,
                  onClick: () => {
                    setSelectedPlayer(player);
                    setActivePlayerName(null);
                  },
                },
                {
                  label: `Combatlog`,
                  onClick: () => {
                    handleOpenCombatlog(player.displayName);
                  },
                },
              ]}
            />
          </li>
        ))}
      </ul>
      {selectedPlayer && (
        <FloatingSection onBackgroundClick={() => setSelectedPlayer(null)}>
          <CurrentPlayerDetails
            player={selectedPlayer}
            onRegister={handleRegisterPlayer}
          />
        </FloatingSection>
      )}
    </section>
  );
}

export default CurrentPlayers;

import { useEffect, useMemo, useState } from "react";
import { Player } from "../types";
import "./HomePage.css";
import PlayersRegList from "../sections/PlayersRegList";
import Chat from "../sections/Chat";
import PlayerDetails from "../sections/PlayerDetails";
import CurrentPlayers from "../sections/CurrentPlayers";

type CreatePlayerPayload = {
  steamid: string;
  tag: string;
  loadSubscription: boolean;
};

type HomePageProps = {
  players: Player[];
  loading: boolean;
  onCreatePlayer: (payload: CreatePlayerPayload) => Promise<boolean>;
  onDeletePlayer: (playerId: number) => Promise<void>;
  onUpdatePlayerTag: (playerId: number, nextTag: string) => Promise<void>;
  onUpdatePlayerDetails: (
    playerId: number,
    payload: {
      tag?: string;
      subscription?: {
        validFrom: string;
        validUntil: string;
      } | null;
    },
  ) => Promise<void>;
  onOpenConsoleWithCommand: (command: string) => void;
};

function HomePage({
  players,
  loading,
  onCreatePlayer,
  onDeletePlayer,
  onUpdatePlayerTag,
  onUpdatePlayerDetails,
  onOpenConsoleWithCommand,
}: HomePageProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  useEffect(() => {
    if (players.length === 0) {
      setSelectedPlayerId(null);
      return;
    }

    setSelectedPlayerId((current) =>
      current !== null && players.some((player) => player.id === current)
        ? current
        : players[0].id,
    );
  }, [players]);

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

  return (
    <div className="home-page">
      <div className="home-page-left-column">
        <PlayersRegList
          players={players}
          selectedPlayerId={selectedPlayerId}
          loading={loading}
          onSelectPlayer={(player) => setSelectedPlayerId(player.id)}
          onCreatePlayer={onCreatePlayer}
          onDeletePlayer={onDeletePlayer}
          onUpdatePlayerTag={onUpdatePlayerTag}
        />
        {selectedPlayer && (
          <PlayerDetails
            player={selectedPlayer}
            loading={loading}
            onClose={() => setSelectedPlayerId(null)}
            onUpdatePlayerDetails={onUpdatePlayerDetails}
          />
        )}
      </div>

      <div className="home-page-right-column">
        <CurrentPlayers onOpenConsoleWithCommand={onOpenConsoleWithCommand} />
        <Chat />
      </div>
    </div>
  );
}

export default HomePage;

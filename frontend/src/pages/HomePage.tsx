import { useEffect, useMemo, useState } from "react";
import { Player } from "../types";
import "./HomePage.css";
import PlayersRegList from "../sections/PlayersRegList";
import Chat from "../sections/Chat";
import CurrentPlayers from "../sections/CurrentPlayers";
import { PlayerRegFormProvider } from "../context/PlayerRegFormContext";
import FloatingSection from "../layout/FloatingSection";
import CurrentPlayerDetails from "../sections/CurrentPlayerDetails";

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
  const [detailsPlayerId, setDetailsPlayerId] = useState<number | null>(null);
  const [detailsPlayerConnected, setDetailsPlayerConnected] =
    useState<boolean>(false);

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

  const detailsPlayer = useMemo(
    () => players.find((player) => player.id === detailsPlayerId) ?? null,
    [players, detailsPlayerId],
  );

  async function handleLoadSubscription(
    player: Player,
    validFrom: string,
    validUntil: string,
  ) {
    await onUpdatePlayerDetails(player.id, {
      subscription: {
        validFrom: `${validFrom}T00:00:00.000Z`,
        validUntil: `${validUntil}T23:59:59.999Z`,
      },
    });
  }

  async function handleRevokeSubscription(player: Player) {
    await onUpdatePlayerDetails(player.id, {
      subscription: null,
    });
  }

  return (
    <PlayerRegFormProvider>
      <div className="home-page">
        <div className="home-page-left-column">
          <PlayersRegList
            players={players}
            selectedPlayerId={selectedPlayerId}
            loading={loading}
            onSelectPlayer={(player) => setSelectedPlayerId(player.id)}
            onViewDetails={(player, isConnected) => {
              setDetailsPlayerId(player.id);
              setDetailsPlayerConnected(isConnected);
            }}
            onCreatePlayer={onCreatePlayer}
            onDeletePlayer={onDeletePlayer}
            onUpdatePlayerTag={onUpdatePlayerTag}
          />
        </div>

        <div className="home-page-right-column">
          <CurrentPlayers onOpenConsoleWithCommand={onOpenConsoleWithCommand} />
          <Chat />
        </div>

        {detailsPlayer && (
          <FloatingSection onBackgroundClick={() => setDetailsPlayerId(null)}>
            <CurrentPlayerDetails
              player={detailsPlayer}
              variant="registered"
              isConnected={detailsPlayerConnected}
              onLoadSubscription={handleLoadSubscription}
              onRevokeSubscription={handleRevokeSubscription}
              loading={loading}
            />
          </FloatingSection>
        )}
      </div>
    </PlayerRegFormProvider>
  );
}

export default HomePage;

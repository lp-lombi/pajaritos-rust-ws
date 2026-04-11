import React, { useEffect, useMemo, useState } from "react";
import { Player } from "../types";
import "./HomePage.css";
import PlayersRegister from "../sections/PlayersRegister";
import Chat from "../sections/Chat";
import PlayerDetails from "../sections/PlayerDetails";

type HomePageProps = {
    steamid: string;
    tag: string;
    loadSubscription: boolean;
    players: Player[];
    loading: boolean;
    onSteamidChange: (value: string) => void;
    onTagChange: (value: string) => void;
    onLoadSubscriptionChange: (value: boolean) => void;
    onCreatePlayer: (event: React.FormEvent<HTMLFormElement>) => void;
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
};

function HomePage({
    steamid,
    tag,
    loadSubscription,
    players,
    loading,
    onSteamidChange,
    onTagChange,
    onLoadSubscriptionChange,
    onCreatePlayer,
    onDeletePlayer,
    onUpdatePlayerTag,
    onUpdatePlayerDetails,
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
                <PlayersRegister
                    steamid={steamid}
                    tag={tag}
                    loadSubscription={loadSubscription}
                    players={players}
                    selectedPlayerId={selectedPlayerId}
                    loading={loading}
                    onSteamidChange={onSteamidChange}
                    onTagChange={onTagChange}
                    onLoadSubscriptionChange={onLoadSubscriptionChange}
                    onSelectPlayer={(player) => setSelectedPlayerId(player.id)}
                    onSubmit={onCreatePlayer}
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
                <Chat />
            </div>
        </div>
    );
}

export default HomePage;

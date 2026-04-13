import React, { useEffect, useRef, useState } from "react";
import "./PlayersRegList.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListDots, faSearch } from "@fortawesome/free-solid-svg-icons";
import Container from "../layout/Container";
import { Player } from "../types";
import ContextMenu from "../components/ContextMenu";
import PlayerRegForm from "./PlayerRegForm";
import FloatingSection from "../layout/FloatingSection";

type CreatePlayerPayload = {
    steamid: string;
    tag: string;
    loadSubscription: boolean;
};

type PlayerVisibilityFilter = "all" | "subscribed" | "unsubscribed";

type PlayersRegList = {
    players: Player[];
    selectedPlayerId?: number | null;
    loading: boolean;
    onSelectPlayer?: (player: Player) => void;
    onCreatePlayer: (payload: CreatePlayerPayload) => Promise<boolean>;
    onDeletePlayer: (playerId: number) => Promise<void>;
    onUpdatePlayerTag: (playerId: number, nextTag: string) => Promise<void>;
};

function PlayersRegList({
    players,
    selectedPlayerId,
    loading,
    onSelectPlayer,
    onCreatePlayer,
    onDeletePlayer,
    onUpdatePlayerTag,
}: PlayersRegList) {
    const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
    const [isRegFormOpen, setIsRegFormOpen] = useState(false);
    const [playerFilter, setPlayerFilter] = useState("");
    const [visibilityFilter, setVisibilityFilter] = useState<PlayerVisibilityFilter>("all");
    const playerListRef = useRef<HTMLUListElement | null>(null);
    const playerMenuButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const normalizedFilter = playerFilter.trim().toLowerCase();
    const filteredPlayers = players.filter((player) => {
        const matchesText =
            !normalizedFilter ||
            player.tag.toLowerCase().includes(normalizedFilter) ||
            player.steamid.toLowerCase().includes(normalizedFilter);

        const isSubscribed = Boolean(player.subscription);

        const matchesVisibility =
            visibilityFilter === "all" ||
            (visibilityFilter === "subscribed" && isSubscribed) ||
            (visibilityFilter === "unsubscribed" && !isSubscribed);

        return matchesText && matchesVisibility;
    });

    useEffect(() => {
        if (!playerListRef.current || selectedPlayerId === null) {
            return;
        }

        const selectedElement = playerListRef.current.querySelector<HTMLLIElement>(
            `li[data-player-id="${selectedPlayerId}"]`,
        );

        selectedElement?.scrollIntoView({ block: "nearest" });
    }, [selectedPlayerId]);

    function handlePlayerListKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
            return;
        }

        if (filteredPlayers.length === 0) {
            return;
        }

        event.preventDefault();

        const currentIndex = filteredPlayers.findIndex((player) => player.id === selectedPlayerId);
        let nextIndex = currentIndex;

        if (currentIndex === -1) {
            nextIndex = event.key === "ArrowDown" ? 0 : filteredPlayers.length - 1;
        } else if (event.key === "ArrowDown") {
            nextIndex = Math.min(currentIndex + 1, filteredPlayers.length - 1);
        } else {
            nextIndex = Math.max(currentIndex - 1, 0);
        }

        const nextPlayer = filteredPlayers[nextIndex];

        if (nextPlayer) {
            onSelectPlayer?.(nextPlayer);
        }
    }

    async function handleChangeTag(player: Player) {
        const nextTag = window.prompt("Nuevo tag del jugador", player.tag);

        if (nextTag === null) {
            return;
        }

        await onUpdatePlayerTag(player.id, nextTag);
    }

    async function handleCreatePlayer(payload: CreatePlayerPayload) {
        const created = await onCreatePlayer(payload);

        if (created) {
            setIsRegFormOpen(false);
        }

        return created;
    }

    return (
        <section className="registered-players-section">
            <Container>
                <h2>Jugadores registrados</h2>
                <ul
                    ref={playerListRef}
                    tabIndex={0}
                    onKeyDown={handlePlayerListKeyDown}
                    aria-label="Lista de jugadores registrados"
                >
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map((player) => (
                            <li
                                key={player.id}
                                data-player-id={player.id}
                                className={
                                    selectedPlayerId === player.id
                                        ? "player-item selected"
                                        : "player-item"
                                }
                                onClick={() => {
                                    onSelectPlayer?.(player);
                                    playerListRef.current?.focus();
                                }}
                            >
                                <div>
                                    <span>{player.tag}</span>
                                    <span>{player.steamid}</span>
                                </div>

                                <div className="player-actions">
                                    <button
                                        ref={(element) => {
                                            playerMenuButtonRefs.current[player.id] = element;
                                        }}
                                        type="button"
                                        className="player-menu-button"
                                        onClick={() => {
                                            setActivePlayerId((prev) =>
                                                prev === player.id ? null : player.id,
                                            );
                                        }}
                                        aria-haspopup="menu"
                                        aria-label={`Abrir menu del jugador ${player.tag}`}
                                        disabled={loading}
                                    >
                                        <FontAwesomeIcon icon={faListDots} />
                                    </button>

                                    <ContextMenu
                                        isOpen={activePlayerId === player.id}
                                        anchorElement={
                                            playerMenuButtonRefs.current[player.id] ?? null
                                        }
                                        onClose={() => setActivePlayerId(null)}
                                        options={[
                                            {
                                                label: "Cambiar tag",
                                                onClick: () => {
                                                    void handleChangeTag(player);
                                                },
                                            },
                                            {
                                                label: "Borrar jugador",
                                                onClick: () => {
                                                    void onDeletePlayer(player.id);
                                                },
                                            },
                                        ]}
                                    />
                                </div>
                            </li>
                        ))
                    ) : (
                        <li>
                            <span>No se encuentran jugadores</span>
                        </li>
                    )}
                </ul>
                <div className="player-filters">
                    <div className="field-group player-filter-field">
                        <FontAwesomeIcon icon={faSearch} />
                        <input
                            id="player-filter"
                            type="text"
                            value={playerFilter}
                            onChange={(e) => setPlayerFilter(e.target.value)}
                            placeholder="Filtrar por tag o steamid"
                            className="text-input"
                        />
                    </div>
                    <div className="player-filter-field">
                        <button
                            type="button"
                            className={`player-filter-button ${visibilityFilter === "all" ? "active" : ""}`}
                            onClick={() => setVisibilityFilter("all")}
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            className={`player-filter-button ${visibilityFilter === "subscribed" ? "active" : ""}`}
                            onClick={() => setVisibilityFilter("subscribed")}
                        >
                            Suscritos
                        </button>
                        <button
                            type="button"
                            className={`player-filter-button ${visibilityFilter === "unsubscribed" ? "active" : ""}`}
                            onClick={() => setVisibilityFilter("unsubscribed")}
                        >
                            No suscritos
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    className="open-player-reg-form-button"
                    onClick={() => setIsRegFormOpen(true)}
                    disabled={loading}
                >
                    Registrar jugador
                </button>

                {isRegFormOpen && (
                    <FloatingSection onBackgroundClick={() => setIsRegFormOpen(false)}>
                        <PlayerRegForm onSubmit={handleCreatePlayer} />
                    </FloatingSection>
                )}
            </Container>
        </section>
    );
}

export default PlayersRegList;

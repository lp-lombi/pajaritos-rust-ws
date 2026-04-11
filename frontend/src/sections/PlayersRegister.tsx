import React, { useEffect, useRef, useState } from "react";
import "./PlayersRegister.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIdBadge, faListDots, faSearch, faTag } from "@fortawesome/free-solid-svg-icons";
import Container from "../layout/Container";
import { Player } from "../types";
import ContextMenu from "../layout/ContextMenu";

type PlayersRegisterProps = {
    steamid: string;
    tag: string;
    loadSubscription: boolean;
    players: Player[];
    selectedPlayerId?: number | null;
    loading: boolean;
    onSteamidChange: (value: string) => void;
    onTagChange: (value: string) => void;
    onLoadSubscriptionChange: (value: boolean) => void;
    onSelectPlayer?: (player: Player) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onDeletePlayer: (playerId: number) => Promise<void>;
    onUpdatePlayerTag: (playerId: number, nextTag: string) => Promise<void>;
};

function PlayersRegister({
    steamid,
    tag,
    loadSubscription,
    players,
    selectedPlayerId,
    loading,
    onSteamidChange,
    onTagChange,
    onLoadSubscriptionChange,
    onSelectPlayer,
    onSubmit,
    onDeletePlayer,
    onUpdatePlayerTag,
}: PlayersRegisterProps) {
    const canSubmit = steamid.trim() !== "" && tag.trim() !== "";
    const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
    const [playerFilter, setPlayerFilter] = useState("");
    const sectionRef = useRef<HTMLElement | null>(null);
    const playerListRef = useRef<HTMLUListElement | null>(null);
    const normalizedFilter = playerFilter.trim().toLowerCase();
    const filteredPlayers = players.filter((player) => {
        if (!normalizedFilter) {
            return true;
        }

        return (
            player.tag.toLowerCase().includes(normalizedFilter) ||
            player.steamid.toLowerCase().includes(normalizedFilter)
        );
    });

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
                setActivePlayerId(null);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, []);

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

    return (
        <section className="registered-players-section" ref={sectionRef}>
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
                                className={selectedPlayerId === player.id ? "player-item selected" : "player-item"}
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
                                        type="button"
                                        className="player-menu-button"
                                        onClick={() =>
                                            setActivePlayerId((prev) =>
                                                prev === player.id ? null : player.id,
                                            )
                                        }
                                        aria-haspopup="menu"
                                        aria-label={`Abrir menu del jugador ${player.tag}`}
                                        disabled={loading}
                                    >
                                        <FontAwesomeIcon icon={faListDots} />
                                    </button>

                                    <ContextMenu
                                        isOpen={activePlayerId === player.id}
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
                <form onSubmit={onSubmit} className="card-form">
                    <h2>Registrar jugador</h2>
                    <div className="field-group">
                        <FontAwesomeIcon icon={faIdBadge} />
                        <input
                            placeholder="Steam ID (Ej: 76561198000000000)"
                            id="steamid"
                            value={steamid}
                            onChange={(e) => onSteamidChange(e.target.value)}
                            className="text-input"
                            maxLength={17}
                            inputMode="numeric"
                        />
                    </div>
                    <div className="field-group">
                        <FontAwesomeIcon icon={faTag} />
                        <input
                            placeholder="Tag (Ej: El enano N)"
                            id="tag"
                            value={tag}
                            onChange={(e) => onTagChange(e.target.value)}
                            className="text-input"
                        />
                    </div>
                    <label className="checkbox-field" htmlFor="load-subscription">
                        <input
                            id="load-subscription"
                            type="checkbox"
                            checked={loadSubscription}
                            onChange={(e) => onLoadSubscriptionChange(e.target.checked)}
                        />
                        Cargar suscripcion
                    </label>
                    <button type="submit" disabled={loading || !canSubmit}>
                        {loading ? "Guardando..." : "Registrar"}
                    </button>
                </form>
            </Container>
        </section>
    );
}

export default PlayersRegister;

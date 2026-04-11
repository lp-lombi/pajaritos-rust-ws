import React, { useEffect, useRef, useState } from "react";
import "./PlayerRegistration.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIdBadge, faListDots, faSearch, faTag } from "@fortawesome/free-solid-svg-icons";
import Container from "../layout/Container";
import { Player } from "../types";
import ContextMenu from "../layout/ContextMenu";

type PlayerRegistrationProps = {
    steamid: string;
    tag: string;
    loadSubscription: boolean;
    players: Player[];
    loading: boolean;
    onSteamidChange: (value: string) => void;
    onTagChange: (value: string) => void;
    onLoadSubscriptionChange: (value: boolean) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onDeletePlayer: (playerId: number) => Promise<void>;
    onUpdatePlayerTag: (playerId: number, nextTag: string) => Promise<void>;
};

function PlayerRegistration({
    steamid,
    tag,
    loadSubscription,
    players,
    loading,
    onSteamidChange,
    onTagChange,
    onLoadSubscriptionChange,
    onSubmit,
    onDeletePlayer,
    onUpdatePlayerTag,
}: PlayerRegistrationProps) {
    const canSubmit = steamid.trim() !== "" && tag.trim() !== "";
    const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
    const [playerFilter, setPlayerFilter] = useState("");
    const sectionRef = useRef<HTMLElement | null>(null);
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
                <ul>
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map((player) => (
                            <li key={player.id}>
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

export default PlayerRegistration;

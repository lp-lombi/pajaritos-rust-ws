import { useEffect, useState } from "react";
import Container from "../layout/Container";
import { Player } from "../types";
import "./PlayerDetails.css";

type PlayerDetailsProps = {
  player: Player | null;
  loading: boolean;
    onClose: () => void;
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

function toDateInputValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function toLocalDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDefaultSubscriptionDates() {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    return {
        validFrom: toLocalDateInputValue(startDate),
        validUntil: toLocalDateInputValue(endDate),
    };
}

function PlayerDetails({ player, loading, onClose, onUpdatePlayerDetails }: PlayerDetailsProps) {
    const [tag, setTag] = useState("");
    const [hasSubscription, setHasSubscription] = useState(false);
    const [validFrom, setValidFrom] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [formError, setFormError] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    function resetFormFromPlayer(currentPlayer: Player | null) {
        if (!currentPlayer) {
            setTag("");
            setHasSubscription(false);
            setValidFrom("");
            setValidUntil("");
            return;
        }

        setTag(currentPlayer.tag);
        setHasSubscription(Boolean(currentPlayer.subscription));

        if (currentPlayer.subscription) {
            setValidFrom(toDateInputValue(currentPlayer.subscription.validFrom));
            setValidUntil(toDateInputValue(currentPlayer.subscription.validUntil));
            return;
        }

        const defaultDates = getDefaultSubscriptionDates();
        setValidFrom(defaultDates.validFrom);
        setValidUntil(defaultDates.validUntil);
    }

    useEffect(() => {
        if (!player) {
            resetFormFromPlayer(null);
            setFormError("");
            setIsEditing(false);
            return;
        }

        resetFormFromPlayer(player);
        setFormError("");
        setIsEditing(false);
    }, [player]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!player) {
            return;
        }

        const normalizedTag = tag.trim();

        if (!normalizedTag) {
            setFormError("El tag no puede estar vacio");
            return;
        }

        if (hasSubscription) {
            if (!validFrom || !validUntil) {
                setFormError("Debes completar las fechas de suscripcion");
                return;
            }

            if (validFrom > validUntil) {
                setFormError("La fecha de inicio no puede ser mayor que la fecha de fin");
                return;
            }
        }

        setFormError("");

        await onUpdatePlayerDetails(player.id, {
            tag: normalizedTag,
            subscription: hasSubscription
                ? {
                    validFrom: `${validFrom}T00:00:00.000Z`,
                    validUntil: `${validUntil}T23:59:59.999Z`,
                }
                : null,
        });

        setIsEditing(false);
    }

    return (
        <section className="player-details-section">
            <Container>
                <div className="player-details-header">
                    <h2>Detalle del jugador</h2>
                    {player && (
                        <div className="player-details-actions">
                            {!isEditing && (
                                <button
                                    type="button"
                                    className="player-details-close-button"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Editar
                                </button>
                            )}
                            {isEditing && (
                                <button
                                    type="button"
                                    className="player-details-close-button"
                                    onClick={() => {
                                        resetFormFromPlayer(player);
                                        setFormError("");
                                        setIsEditing(false);
                                    }}
                                >
                                    Cancelar
                                </button>
                            )}
                            <button type="button" className="player-details-close-button" onClick={onClose}>
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>

                {!player && <p>Selecciona un jugador para ver su detalle y suscripcion.</p>}

                {player && !isEditing && (
                    <div className="player-details-grid">
                        <div>
                            <h3>Jugador</h3>
                            <p>
                                <strong>ID:</strong> {player.id}
                            </p>
                            <p>
                                <strong>Steam ID:</strong> {player.steamid}
                            </p>
                            <p>
                                <strong>Tag:</strong> {player.tag}
                            </p>
                        </div>

                        <div>
                            <h3>Suscripcion</h3>
                            {player.subscription ? (
                                <>
                                    <p>
                                        <strong>Desde:</strong> {formatDate(player.subscription.validFrom)}
                                    </p>
                                    <p>
                                        <strong>Hasta:</strong> {formatDate(player.subscription.validUntil)}
                                    </p>
                                </>
                            ) : (
                                <p>Este jugador no tiene suscripcion.</p>
                            )}
                        </div>
                    </div>
                )}

                {player && isEditing && (
                    <form className="player-details-form" onSubmit={handleSubmit}>
                        <div className="player-details-grid">
                            <div>
                                <h3>Jugador</h3>
                                <p>
                                    <strong>ID:</strong> {player.id}
                                </p>
                                <p>
                                    <strong>Steam ID:</strong> {player.steamid}
                                </p>
                                <label htmlFor="player-detail-tag">Tag</label>
                                <input
                                    id="player-detail-tag"
                                    type="text"
                                    value={tag}
                                    onChange={(event) => setTag(event.target.value)}
                                />
                            </div>

                            <div>
                                <h3>Suscripcion</h3>
                                <label className="checkbox-field" htmlFor="player-detail-has-subscription">
                                    <input
                                        id="player-detail-has-subscription"
                                        type="checkbox"
                                        checked={hasSubscription}
                                        onChange={(event) => {
                                            const checked = event.target.checked;
                                            setHasSubscription(checked);

                                            if (checked && (!validFrom || !validUntil)) {
                                                const defaultDates = getDefaultSubscriptionDates();
                                                setValidFrom(defaultDates.validFrom);
                                                setValidUntil(defaultDates.validUntil);
                                            }
                                        }}
                                    />
                                    Tiene suscripcion
                                </label>

                                {hasSubscription && (
                                    <div className="subscription-fields">
                                        <label htmlFor="player-detail-valid-from">Valida desde</label>
                                        <input
                                            id="player-detail-valid-from"
                                            type="date"
                                            value={validFrom}
                                            onChange={(event) => setValidFrom(event.target.value)}
                                        />

                                        <label htmlFor="player-detail-valid-until">Valida hasta</label>
                                        <input
                                            id="player-detail-valid-until"
                                            type="date"
                                            value={validUntil}
                                            onChange={(event) => setValidUntil(event.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar cambios"}
                        </button>
                        {formError && <p>{formError}</p>}
                    </form>
                )}
            </Container>
        </section>
    );
}

export default PlayerDetails;
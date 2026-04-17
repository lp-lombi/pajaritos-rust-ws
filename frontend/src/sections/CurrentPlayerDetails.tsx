import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { RustPlayer } from "../services/commands-parser";
import { usePlayerRegForm } from "../context/PlayerRegFormContext";
import "./CurrentPlayerDetails.css";
import { useRustConsole } from "../context/RustConsoleContext";
import {
  createPlayerNote,
  getPlayerNotes,
  getSteamProfile,
} from "../services/http-client";
import { Note, Player } from "../types";

const DEFAULT_STEAM_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='18' fill='%231b2838'/%3E%3Ccircle cx='48' cy='38' r='18' fill='%23314d63'/%3E%3Cpath d='M20 82c5-15 18-22 28-22s23 7 28 22' fill='%23314d63'/%3E%3C/svg%3E";

interface CurrentPlayerDetailsProps {
  player: RustPlayer | Player;
  variant?: "current" | "registered";
  onRegister?: (player: RustPlayer) => void;
  isConnected?: boolean;
  onLoadSubscription?: (
    player: Player,
    validFrom: string,
    validUntil: string,
  ) => Promise<void> | void;
  onRevokeSubscription?: (player: Player) => Promise<void> | void;
  loading?: boolean;
}

function toDateInputValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
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
  endDate.setDate(endDate.getDate() + 30);

  return {
    validFrom: toLocalDateInputValue(startDate),
    validUntil: toLocalDateInputValue(endDate),
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CurrentPlayerDetails({
  player,
  variant = "current",
  onRegister,
  isConnected = false,
  onLoadSubscription,
  onRevokeSubscription,
  loading = false,
}: CurrentPlayerDetailsProps) {
  const { openPlayerRegForm } = usePlayerRegForm();
  const { executeCommand } = useRustConsole();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [notesError, setNotesError] = useState("");
  const isCurrentPlayer = variant === "current";

  const steamId = isCurrentPlayer
    ? (player as RustPlayer).steamId
    : (player as Player).steamid;
  const playerName = isCurrentPlayer
    ? (player as RustPlayer).displayName
    : (player as Player).tag;
  const registeredPlayer = !isCurrentPlayer ? (player as Player) : null;

  useEffect(() => {
    let isMounted = true;

    async function loadSteamProfile() {
      if (!steamId) {
        setAvatarUrl(null);
        return;
      }

      try {
        const profile = await getSteamProfile(steamId);

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
  }, [steamId]);

  useEffect(() => {
    if (!registeredPlayer) {
      setValidFrom("");
      setValidUntil("");
      setSubscriptionError("");
      return;
    }

    if (registeredPlayer.subscription) {
      setValidFrom(toDateInputValue(registeredPlayer.subscription.validFrom));
      setValidUntil(toDateInputValue(registeredPlayer.subscription.validUntil));
      setSubscriptionError("");
      return;
    }

    const defaults = getDefaultSubscriptionDates();
    setValidFrom(defaults.validFrom);
    setValidUntil(defaults.validUntil);
    setSubscriptionError("");
  }, [
    registeredPlayer?.id,
    registeredPlayer?.subscription?.validFrom,
    registeredPlayer?.subscription?.validUntil,
  ]);

  useEffect(() => {
    if (!registeredPlayer) {
      setNotes([]);
      setNoteDraft("");
      setNotesError("");
      setNotesLoading(false);
      return;
    }

    const playerId = registeredPlayer.id;

    let isMounted = true;

    async function loadNotes() {
      setNotesLoading(true);
      setNotesError("");

      try {
        const nextNotes = await getPlayerNotes(playerId);

        if (isMounted) {
          setNotes(nextNotes);
        }
      } catch (error) {
        if (isMounted) {
          setNotesError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las notas",
          );
        }
      } finally {
        if (isMounted) {
          setNotesLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      isMounted = false;
    };
  }, [registeredPlayer?.id]);

  async function handleCreateNote() {
    if (!registeredPlayer) {
      return;
    }

    const content = noteDraft.trim();

    if (!content) {
      setNotesError("La nota no puede estar vacía.");
      return;
    }

    setNoteSubmitting(true);
    setNotesError("");

    try {
      const createdNote = await createPlayerNote(registeredPlayer.id, content);
      setNotes((prev) => [createdNote, ...prev]);
      setNoteDraft("");
    } catch (error) {
      setNotesError(
        error instanceof Error ? error.message : "No se pudo guardar la nota",
      );
    } finally {
      setNoteSubmitting(false);
    }
  }

  return (
    <div className="current-player-details">
      <h2>
        {isCurrentPlayer
          ? "Detalles del jugador actual"
          : "Detalles del jugador registrado"}
      </h2>
      <div>
        <div className="current-player-avatar-wrap">
          <img
            className="current-player-avatar"
            src={avatarUrl ?? DEFAULT_STEAM_AVATAR}
            alt={`Avatar de ${playerName}`}
            onError={(event) => {
              event.currentTarget.src = DEFAULT_STEAM_AVATAR;
            }}
          />
        </div>
        <div className="current-player-name-row">
          <span
            className={`current-player-status-dot ${
              isCurrentPlayer || isConnected ? "connected" : "disconnected"
            }`}
            aria-hidden="true"
          />
          <h3>{playerName}</h3>
        </div>
        <div className="current-player-details-field">
          <strong>SteamID:</strong>
          <span>{steamId}</span>
        </div>

        {isCurrentPlayer ? (
          <>
            <div className="current-player-details-field">
              <strong>Ping:</strong>
              <span>{(player as RustPlayer).ping} ms</span>
            </div>
            <div className="current-player-details-field">
              <strong>IP:</strong>
              <span>{(player as RustPlayer).ip}</span>
            </div>
            <div className="current-player-details-field">
              <strong>ID de entidad:</strong>
              <span>{(player as RustPlayer).entityId}</span>
            </div>
            <div className="current-player-details-field">
              <strong>Tiempo de conexión:</strong>
              <span>
                {Math.round((player as RustPlayer).connectedSeconds / 60)}{" "}
                minutos
              </span>
            </div>
            <div className="current-player-details-actions">
              <button
                onClick={() => {
                  executeCommand(
                    `kick ${steamId} "Fuiste expulsado del servidor."`,
                  );
                }}
              >
                Kickear
              </button>
              <button
                onClick={() => {
                  if (onRegister) {
                    onRegister(player as RustPlayer);
                    return;
                  }

                  openPlayerRegForm({
                    steamid: steamId,
                    tag: playerName,
                    loadSubscription: false,
                  });
                }}
              >
                Registrar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="current-player-details-field">
              <strong>Suscripción:</strong>
              <span>
                {registeredPlayer?.subscription ? "Activa" : "No cargada"}
              </span>
            </div>
            {onLoadSubscription && registeredPlayer && (
              <div className="current-player-details-actions">
                <button
                  disabled={loading}
                  onClick={() => {
                    if (!validFrom || !validUntil) {
                      setSubscriptionError("Debes completar ambas fechas.");
                      return;
                    }

                    if (validFrom > validUntil) {
                      setSubscriptionError(
                        "La fecha desde no puede ser mayor a la fecha hasta.",
                      );
                      return;
                    }

                    setSubscriptionError("");
                    void onLoadSubscription(
                      registeredPlayer,
                      validFrom,
                      validUntil,
                    );
                  }}
                >
                  {registeredPlayer.subscription ? "Renovar sub" : "Cargar sub"}
                </button>
                {registeredPlayer.subscription && onRevokeSubscription && (
                  <button
                    disabled={loading}
                    onClick={() => {
                      setSubscriptionError("");
                      void onRevokeSubscription(registeredPlayer);
                    }}
                  >
                    Revocar sub
                  </button>
                )}
              </div>
            )}
            {onLoadSubscription && registeredPlayer && (
              <div className="current-player-subscription-fields">
                <div className="current-player-subscription-row">
                  <div className="current-player-subscription-field">
                    <label htmlFor="registered-valid-from">Válida desde</label>
                    <input
                      id="registered-valid-from"
                      type="date"
                      value={validFrom}
                      onChange={(event) => setValidFrom(event.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="current-player-subscription-field">
                    <label htmlFor="registered-valid-until">Válida hasta</label>
                    <input
                      id="registered-valid-until"
                      type="date"
                      value={validUntil}
                      onChange={(event) => setValidUntil(event.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {subscriptionError && (
                  <p className="current-player-subscription-error">
                    {subscriptionError}
                  </p>
                )}
              </div>
            )}

            {registeredPlayer && (
              <div className="current-player-notes">
                <h4>Notas</h4>

                <div className="current-player-notes-input-row">
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Agregar notas"
                    rows={3}
                    disabled={noteSubmitting || loading}
                  />

                  <button
                    type="button"
                    className="current-player-note-save-button"
                    aria-label="Guardar nota"
                    title="Guardar nota"
                    disabled={noteSubmitting || loading}
                    onClick={() => {
                      void handleCreateNote();
                    }}
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} />
                  </button>
                </div>

                {notesError && (
                  <p className="current-player-subscription-error">
                    {notesError}
                  </p>
                )}

                {notesLoading ? (
                  <p>Cargando notas...</p>
                ) : notes.length === 0 ? (
                  <p>No hay notas para este jugador.</p>
                ) : (
                  <ul className="current-player-notes-list">
                    {notes.map((note) => (
                      <li key={note.id}>
                        <p>{note.content}</p>
                        <small>{formatDateTime(note.createdAt)}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CurrentPlayerDetails;

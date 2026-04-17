import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIdBadge, faTag } from "@fortawesome/free-solid-svg-icons";
import "./PlayerRegForm.css";

type CreatePlayerPayload = {
  steamid: string;
  tag: string;
  loadSubscription: boolean;
};

type PlayerRegFormProps = {
  onSubmit: (payload: CreatePlayerPayload) => Promise<boolean>;
  initialValues?: Partial<CreatePlayerPayload>;
};

function PlayerRegForm({ onSubmit, initialValues }: PlayerRegFormProps) {
  const [steamid, setSteamid] = React.useState(initialValues?.steamid ?? "");
  const [tag, setTag] = React.useState(initialValues?.tag ?? "");
  const [loadSubscription, setLoadSubscription] = React.useState(
    initialValues?.loadSubscription ?? false,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const canSubmit = steamid.trim() !== "" && tag.trim() !== "";

  React.useEffect(() => {
    setSteamid(initialValues?.steamid ?? "");
    setTag(initialValues?.tag ?? "");
    setLoadSubscription(initialValues?.loadSubscription ?? false);
  }, [
    initialValues?.steamid,
    initialValues?.tag,
    initialValues?.loadSubscription,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await onSubmit({
        steamid: steamid.trim(),
        tag: tag.trim(),
        loadSubscription,
      });

      if (created) {
        setSteamid("");
        setTag("");
        setLoadSubscription(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-form">
      <h2>Registrar jugador</h2>
      <div className="field-group">
        <FontAwesomeIcon icon={faIdBadge} />
        <input
          placeholder="Steam ID (Ej: 76561198000000000)"
          id="steamid"
          value={steamid}
          onChange={(e) =>
            setSteamid(e.target.value.replace(/\D/g, "").slice(0, 17))
          }
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
          onChange={(e) => setTag(e.target.value)}
          className="text-input"
        />
      </div>
      <label className="checkbox-field" htmlFor="load-subscription">
        <input
          id="load-subscription"
          type="checkbox"
          checked={loadSubscription}
          onChange={(e) => setLoadSubscription(e.target.checked)}
        />
        Cargar suscripcion
      </label>
      <button type="submit" disabled={isSubmitting || !canSubmit}>
        {isSubmitting ? "Guardando..." : "Registrar"}
      </button>
    </form>
  );
}

export default PlayerRegForm;

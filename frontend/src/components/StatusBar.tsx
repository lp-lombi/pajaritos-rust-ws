import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./StatusBar.css";
import { faTerminal } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { LoggedUser } from "../types";

type StatusType = "info" | "error";

type StatusBarProps = {
  message?: string;
  type?: StatusType;
  user?: LoggedUser | null;
  consoleVisible: boolean;
  onToggleConsole: () => void;
};

type RconStatus = "OK" | "CAIDO" | "...";

function StatusBar({
  message,
  type,
  user,
  consoleVisible,
  onToggleConsole,
}: StatusBarProps) {
  const [rconStatus, setRconStatus] = useState<RconStatus>("...");

  const fetchRconHealth = async () => {
    try {
      const response = await fetch("/api/rust/health");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRconStatus(data.connected ? "OK" : "CAIDO");
    } catch (error) {
      console.error("Error obteniendo estado de RCON:", error);
      setRconStatus("CAIDO");
    }
  };

  useEffect(() => {
    fetchRconHealth();
    const id = setInterval(fetchRconHealth, 5000);
    return () => clearInterval(id);
  }, []);

  const statusClassName =
    type === "error"
      ? "status-bar-message is-error"
      : "status-bar-message is-info";
  const rconClassName = `rcon-status ${rconStatus === "OK" ? "status-bar-message is-info" : rconStatus === "CAIDO" ? "status-bar-message is-error" : "is-unknown"}`;

  return (
    <>
      <footer
        className="status-bar"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="status-bar-info">
          {user && <p className={rconClassName}>RCON: {rconStatus}</p>}
          {message ? <p className={statusClassName}>Resp: {message}</p> : null}
        </div>
        {user && (
          <div className="status-bar-actions">
            <button onClick={onToggleConsole}>
              <FontAwesomeIcon icon={faTerminal} />
              {consoleVisible ? "Cerrar consola" : "Consola"}
            </button>
          </div>
        )}
      </footer>
    </>
  );
}

export default StatusBar;

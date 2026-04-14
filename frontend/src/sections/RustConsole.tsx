import { useState } from "react";
import "./RustConsole.css";

interface LogEntry {
  type: "command" | "response";
  message: string;
}

type CommandApiResponse = {
  ok?: boolean;
  error?: string;
  response?: {
    identifier?: number;
    type?: string;
    message?: string;
    raw?: unknown;
  };
};

function RustConsole() {
  const [commandLog, setCommandLog] = useState<LogEntry[]>([]);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);

  const formatResponseMessage = (data: CommandApiResponse) => {
    if (
      typeof data?.response?.message === "string" &&
      data.response.message.trim()
    ) {
      /// en este punto se pierden los saltos de lineaW
      return data.response.message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }

    if (data?.response) {
      return JSON.stringify(data.response);
    }

    return "Comando ejecutado sin respuesta textual";
  };

  const sendCommand = async (command: string) => {
    if (isWaitingResponse) {
      return;
    }

    setIsWaitingResponse(true);

    try {
      const response = await fetch("/api/rust/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CommandApiResponse = await response.json();
      setCommandLog((prev) => [
        ...prev,
        { type: "command", message: `> ${command}` },
        { type: "response", message: formatResponseMessage(data) },
      ]);
    } catch (error) {
      console.error("Error sending RCON command:", error);
      setCommandLog((prev) => [
        ...prev,
        { type: "command", message: `> ${command}` },
        { type: "response", message: "Error enviando comando al backend" },
      ]);
    } finally {
      setIsWaitingResponse(false);
    }
  };

  return (
    <div className="console">
      <h2>Emulador de consola de Rust</h2>
      <div className="console-out">
        {commandLog.map((entry, index) => (
          <p
            key={index}
            className={
              entry.type === "command" ? "console-command" : "console-response"
            }
          >
            {entry.message}
          </p>
        ))}
      </div>
      <form action="">
        <input
          type="text"
          className="console-in"
          placeholder={isWaitingResponse ? "Esperando respuesta..." : ">"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const input = e.currentTarget as HTMLInputElement;
              const command = input.value.trim();
              if (command && !isWaitingResponse) {
                sendCommand(command);
                input.value = "";
              }
            }
          }}
        />
      </form>
    </div>
  );
}

export default RustConsole;

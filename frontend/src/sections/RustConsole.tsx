import { useRustConsole } from "../context/RustConsoleContext";
import "./RustConsole.css";

function RustConsole() {
  const { commandLog, isWaitingResponse, enqueueCommand } = useRustConsole();

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
              if (command) {
                enqueueCommand(command);
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

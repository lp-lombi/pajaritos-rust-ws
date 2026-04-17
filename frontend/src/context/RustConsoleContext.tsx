import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type ConsoleLogEntry = {
  type: "command" | "response";
  message: string;
};

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

type RustConsoleContextValue = {
  commandLog: ConsoleLogEntry[];
  isWaitingResponse: boolean;
  queueSize: number;
  enqueueCommand: (command: string) => void;
  executeCommand: (command: string) => Promise<CommandApiResponse>;
  clearCommandLog: () => void;
};

const RustConsoleContext = createContext<RustConsoleContextValue | undefined>(
  undefined,
);

type RustConsoleProviderProps = {
  children: ReactNode;
};

function formatResponseMessage(data: CommandApiResponse) {
  if (
    typeof data?.response?.message === "string" &&
    data.response.message.trim()
  ) {
    return data.response.message;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (data?.response) {
    return JSON.stringify(data.response);
  }

  return "Comando ejecutado sin respuesta textual";
}

export function RustConsoleProvider({ children }: RustConsoleProviderProps) {
  const [commandLog, setCommandLog] = useState<ConsoleLogEntry[]>([]);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [commandQueue, setCommandQueue] = useState<string[]>([]);

  const executeCommand = async (command: string) => {
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

    return (await response.json()) as CommandApiResponse;
  };

  const runCommand = async (command: string) => {
    setIsWaitingResponse(true);

    try {
      const data = await executeCommand(command);
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

  const enqueueCommand = (command: string) => {
    const normalizedCommand = command.trim();

    if (!normalizedCommand) {
      return;
    }

    setCommandQueue((prev) => [...prev, normalizedCommand]);
  };

  const clearCommandLog = () => {
    setCommandLog([]);
  };

  useEffect(() => {
    if (isWaitingResponse || commandQueue.length === 0) {
      return;
    }

    const [nextCommand, ...rest] = commandQueue;
    setCommandQueue(rest);
    void runCommand(nextCommand);
  }, [commandQueue, isWaitingResponse]);

  return (
    <RustConsoleContext.Provider
      value={{
        commandLog,
        isWaitingResponse,
        queueSize: commandQueue.length,
        enqueueCommand,
        executeCommand,
        clearCommandLog,
      }}
    >
      {children}
    </RustConsoleContext.Provider>
  );
}

export function useRustConsole() {
  const context = useContext(RustConsoleContext);

  if (!context) {
    throw new Error("useRustConsole must be used within RustConsoleProvider");
  }

  return context;
}

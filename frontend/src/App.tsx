import React, { useEffect, useState } from "react";
import Container from "./layout/Container";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./context/AuthContext";
import { LoggedUser, Player } from "./types";
import "./App.css";
import Header from "./sections/Header";
import StatusBar from "./components/StatusBar";

type UpdatePlayerPayload = {
    tag?: string;
    subscription?: {
        validFrom: string;
        validUntil: string;
    } | null;
};

type CreatePlayerPayload = {
    steamid: string;
    tag: string;
    loadSubscription: boolean;
};

const AUTH_USER_STORAGE_KEY = "auth_user";

function getStoredUser(): LoggedUser | null {
    const stored = localStorage.getItem(AUTH_USER_STORAGE_KEY);

    if (!stored) {
        return null;
    }

    try {
        return JSON.parse(stored) as LoggedUser;
    } catch {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        return null;
    }
}

function App() {
    const [loginUsername, setLoginUsername] = useState("admin");
    const [loginPassword, setLoginPassword] = useState("admin123");
    const [user, setUser] = useState<LoggedUser | null>(() => getStoredUser());
    const [players, setPlayers] = useState<Player[]>([]);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);
    const statusType = error ? "error" : info ? "info" : undefined;
    const statusMessage = error || info;

    useEffect(() => {
        if (user) {
            localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
            void loadPlayers();
            return;
        }

        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }, [user]);

    useEffect(() => {
        if (!statusMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setError("");
            setInfo("");
        }, 5000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [statusMessage]);

    function handleLogout() {
        setUser(null);
        setPlayers([]);
        setError("");
        setInfo("Sesion cerrada");
    }

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setInfo("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: loginUsername, password: loginPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Error al iniciar sesión");
                return;
            }

            setUser(data);
            setInfo("Login correcto");
        } catch {
            setError("No se pudo conectar con el backend");
        } finally {
            setLoading(false);
        }
    }

    async function loadPlayers() {
        try {
            const response = await fetch("/api/players");
            const data = await response.json();
            if (response.ok) {
                setPlayers(data);
            }
        } catch {
            setError("No se pudo cargar la lista de players");
        }
    }

    async function handleCreatePlayer({
        steamid,
        tag,
        loadSubscription,
    }: CreatePlayerPayload): Promise<boolean> {
        if (!/^\d{17}$/.test(steamid.trim()) || tag.trim() === "") {
            setError("El steamid debe tener exactamente 17 digitos");
            return false;
        }

        setLoading(true);
        setError("");
        setInfo("");

        try {
            const response = await fetch("/api/players", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    steamid: steamid.trim(),
                    tag: tag.trim(),
                    loadSubscription,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.error ?? "No se pudo crear el player");
                return false;
            }

            setPlayers((prev) => [...prev, data]);
            setInfo("Player creado correctamente");
            return true;
        } catch {
            setError("No se pudo conectar con el backend");
            return false;
        } finally {
            setLoading(false);
        }
    }

    async function handleDeletePlayer(playerId: number) {
        setLoading(true);
        setError("");
        setInfo("");

        try {
            const response = await fetch(`/api/players/${playerId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                setError(data?.error ?? "No se pudo borrar el player");
                return;
            }

            setPlayers((prev) => prev.filter((player) => player.id !== playerId));
            setInfo("Player borrado correctamente");
        } catch {
            setError("No se pudo conectar con el backend");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdatePlayerTag(playerId: number, nextTag: string) {
        const normalizedTag = nextTag.trim();

        if (!normalizedTag) {
            setError("El tag no puede estar vacio");
            return;
        }

        setLoading(true);
        setError("");
        setInfo("");

        try {
            const response = await fetch(`/api/players/${playerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tag: normalizedTag }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "No se pudo actualizar el tag");
                return;
            }

            setPlayers((prev) =>
                prev.map((player) => (player.id === playerId ? { ...player, ...data } : player))
            );
            setInfo("Tag actualizado correctamente");
        } catch {
            setError("No se pudo conectar con el backend");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdatePlayerDetails(playerId: number, payload: UpdatePlayerPayload) {
        if (!payload.tag && payload.subscription === undefined) {
            setError("No hay cambios para guardar");
            return;
        }

        setLoading(true);
        setError("");
        setInfo("");

        try {
            const response = await fetch(`/api/players/${playerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "No se pudo actualizar el player");
                return;
            }

            setPlayers((prev) =>
                prev.map((player) => (player.id === playerId ? { ...player, ...data } : player))
            );
            setInfo("Player actualizado correctamente");
        } catch {
            setError("No se pudo conectar con el backend");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <AuthProvider value={{ user, setUser, logout: handleLogout }}>
                <Header />
                <Container>
                    {!user && (
                        <LoginPage
                            username={loginUsername}
                            password={loginPassword}
                            loading={loading}
                            onUsernameChange={setLoginUsername}
                            onPasswordChange={setLoginPassword}
                            onSubmit={handleLogin}
                        />
                    )}

                    {user && (
                        <HomePage
                            players={players}
                            loading={loading}
                            onCreatePlayer={handleCreatePlayer}
                            onDeletePlayer={handleDeletePlayer}
                            onUpdatePlayerTag={handleUpdatePlayerTag}
                            onUpdatePlayerDetails={handleUpdatePlayerDetails}
                        />
                    )}
                </Container>
                <StatusBar message={statusMessage} type={statusType} />
            </AuthProvider>
        </>
    );
}

export default App;

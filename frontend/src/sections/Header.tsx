import "./Header.css";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ContextMenu from "../layout/ContextMenu";

function Header() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <header>
            <div className="header-title">
                <h1>Pajaritos Rust WS</h1>
                <p>¡LARGA VIDA A PAJARITOS!</p>
            </div>

            <div className="header-links">
                <a href="">
                    <button>Panel del servidor</button>
                </a>
                <a href="">
                    <button>Base de datos</button>
                </a>
            </div>

            <div className="header-session" ref={menuContainerRef}>
                {user ? (
                    <>
                        <span className="header-session-label">
                            Sesion iniciada como <strong>{user.username}</strong>
                        </span>

                        <button
                            type="button"
                            className="header-menu-button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            aria-haspopup="menu"
                            aria-label="Abrir menu de usuario"
                        >
                            <span className="header-menu-label">Opciones</span>
                            <span className="header-menu-icon" aria-hidden="true">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        </button>

                        <ContextMenu
                            isOpen={menuOpen}
                            onClose={() => setMenuOpen(false)}
                            options={[
                                {
                                    label: "Cerrar sesión",
                                    onClick: () => {
                                        logout();
                                        setMenuOpen(false);
                                    },
                                },
                            ]}
                        />
                    </>
                ) : (
                    <span></span>
                )}
            </div>
        </header>
    );
}

export default Header;

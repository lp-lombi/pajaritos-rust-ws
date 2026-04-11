import { createContext, ReactNode, useContext } from "react";
import { LoggedUser } from "../types";

type AuthContextValue = {
    user: LoggedUser | null;
    setUser: (user: LoggedUser | null) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
    value: AuthContextValue;
    children: ReactNode;
};

export function AuthProvider({ value, children }: AuthProviderProps) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}
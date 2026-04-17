import { createContext, ReactNode, useContext, useState } from "react";

type PlayerRegFormDraft = {
  steamid: string;
  tag: string;
  loadSubscription: boolean;
} | null;

type PlayerRegFormContextValue = {
  isOpen: boolean;
  draft: PlayerRegFormDraft;
  openPlayerRegForm: (draft?: PlayerRegFormDraft) => void;
  closePlayerRegForm: () => void;
};

const PlayerRegFormContext = createContext<
  PlayerRegFormContextValue | undefined
>(undefined);

type PlayerRegFormProviderProps = {
  children: ReactNode;
};

export function PlayerRegFormProvider({
  children,
}: PlayerRegFormProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<PlayerRegFormDraft>(null);

  const openPlayerRegForm = (nextDraft: PlayerRegFormDraft = null) => {
    setDraft(nextDraft);
    setIsOpen(true);
  };

  const closePlayerRegForm = () => {
    setIsOpen(false);
  };

  return (
    <PlayerRegFormContext.Provider
      value={{
        isOpen,
        draft,
        openPlayerRegForm,
        closePlayerRegForm,
      }}
    >
      {children}
    </PlayerRegFormContext.Provider>
  );
}

export function usePlayerRegForm() {
  const context = useContext(PlayerRegFormContext);

  if (!context) {
    throw new Error(
      "usePlayerRegForm must be used within PlayerRegFormProvider",
    );
  }

  return context;
}

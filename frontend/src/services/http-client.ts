export const getRconHealth = async (): Promise<any> => {
    const response = await fetch('/api/rust/healths')
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
}

export const getChat = async (): Promise<any> => {
    const response = await fetch('/api/rust/chat')
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data;
}

export const sendRustSay = async (message: string): Promise<void> => {
    const response = await fetch('/api/rust/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
    })
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
}

type SteamProfileResponse = {
    steamId: string;
    avatarIcon: string | null;
    avatarMedium: string | null;
    avatarFull: string | null;
};

export const getSteamProfile = async (steamId: string): Promise<SteamProfileResponse> => {
    const response = await fetch(`/api/steam/profile/${steamId}`)

    if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? `HTTP error! status: ${response.status}`)
    }

    return await response.json() as SteamProfileResponse
}

type PlayerNote = {
    id: number;
    content: string;
    createdAt: string;
    playerId: number;
};

export const getPlayerNotes = async (playerId: number): Promise<PlayerNote[]> => {
    const response = await fetch(`/api/players/${playerId}/notes`)

    if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? `HTTP error! status: ${response.status}`)
    }

    return await response.json() as PlayerNote[]
}

export const createPlayerNote = async (playerId: number, content: string): Promise<PlayerNote> => {
    const response = await fetch(`/api/players/${playerId}/notes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    })

    if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? `HTTP error! status: ${response.status}`)
    }

    return await response.json() as PlayerNote
}
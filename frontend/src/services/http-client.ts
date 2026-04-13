export const getChat = async (): Promise<any> => {
    const response = await fetch('/api/rust/chat')
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data;
}


export const sendMessage = async (message: string): Promise<void> => {
    const response = await fetch('http://127.0.0.1:3210/messages', {
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
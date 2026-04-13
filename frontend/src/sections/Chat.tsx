import { useCallback, useEffect, useRef, useState } from 'react'
import Container from '../layout/Container'
import { getChat, sendRustSay } from '../services/http-client'

import "./Chat.css"

function Chat() {
    const [log, setLog] = useState<string[]>([]);

    const updateChat = useCallback(async () => {
        try {
            const data = await getChat();
            const messages = Array.isArray(data?.messages)
                ? data.messages.map((m: any) => {
                    if (typeof m?.content === 'string') return m.content;

                    const user = typeof m?.user === 'string' ? m.user : 'Unknown';
                    const message = typeof m?.message === 'string' ? m.message : '';
                    return `${user}: ${message}`;
                })
                : [];
            setLog(messages);
        } catch (error) {
            console.error('Error obteniendo chat:', error);
        }
    }, []);

    useEffect(() => {
        updateChat();
        const id = setInterval(updateChat, 1000);
        return () => clearInterval(id);
    }, [updateChat]);

    const chatLogRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);

    const scrollToBottom = useCallback(() => {
        const chatLogElement = chatLogRef.current;

        if (!chatLogElement) {
            return;
        }

        chatLogElement.scrollTop = chatLogElement.scrollHeight;
    }, []);

    useEffect(() => {
        if (shouldStickToBottomRef.current) {
            scrollToBottom();
        }
    }, [log, scrollToBottom]);

    function handleChatScroll() {
        const chatLogElement = chatLogRef.current;

        if (!chatLogElement) {
            return;
        }

        const distanceFromBottom =
            chatLogElement.scrollHeight - chatLogElement.scrollTop - chatLogElement.clientHeight;

        shouldStickToBottomRef.current = distanceFromBottom <= 8;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const input = event.currentTarget.elements.namedItem("message") as HTMLInputElement;
        const value = input.value.trim();

        if (value === "") {
            return;
        }

        await sendRustSay(value);
        await updateChat();

        shouldStickToBottomRef.current = true;
        input.value = "";
    }

    return (
        <section className="chat-section">
            <Container>
                <h2>Chat</h2>
                <div className="chat-log" ref={chatLogRef} onScroll={handleChatScroll}>
                    {log.map((message, index) => (
                        <div key={index} className="chat-message">
                            {message}
                        </div>
                    ))}
                </div>
                <form className="chat-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="message"
                        placeholder="Enviar mensaje [SERVIDOR]"
                        className="chat-input"
                    />
                    <button type="submit" className="chat-submit">
                        Enviar
                    </button>
                </form>
            </Container>
        </section>
    );
}

export default Chat
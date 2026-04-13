import { useCallback, useEffect, useRef, useState } from 'react'
import Container from '../layout/Container'

import "./Chat.css"
import { getChat, sendMessage } from '../services/http-client'

function Chat() {

    const [log, setLog] = useState<string[]>([])

    const updateChat = async () => {
        try {
            const data = await getChat()
            if (data.messages) {
                setLog(data.messages.map((m: { content: string }) => {
                    const msg = m.content as string;
                
                    if (msg.startsWith("**")) {
                        return msg.replace(/\*\*/g, '').trim();
                    }
                }).reverse()            
            )
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error)
        }
    }

    useEffect(() => {
        updateChat()
        setInterval(updateChat, 5000)
    }, [])

    const chatLogRef = useRef<HTMLDivElement | null>(null)
    const shouldStickToBottomRef = useRef(true)

    const scrollToBottom = useCallback(() => {
        const chatLogElement = chatLogRef.current

        if (!chatLogElement) {
            return
        }

        chatLogElement.scrollTop = chatLogElement.scrollHeight
    }, [])

    useEffect(() => {
        if (shouldStickToBottomRef.current) {
            scrollToBottom()
        }
    }, [log, scrollToBottom])

    function handleChatScroll() {
        const chatLogElement = chatLogRef.current

        if (!chatLogElement) {
            return
        }

        const distanceFromBottom =
            chatLogElement.scrollHeight - chatLogElement.scrollTop - chatLogElement.clientHeight

        shouldStickToBottomRef.current = distanceFromBottom <= 8
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const input = event.currentTarget.elements.namedItem('message') as HTMLInputElement
        const value = input.value.trim()

        if (value === '') {
            return
        }

        await sendMessage(value);
        updateChat()

        shouldStickToBottomRef.current = true
        input.value = ''
    }

  return (
    <section className='chat-section'>
        <Container>
            <h2>Chat</h2>
            <div className='chat-log' ref={chatLogRef} onScroll={handleChatScroll}>
                {log.map((message, index) => (
                    <div key={index} className='chat-message'>
                        {message}
                    </div>
                ))}
            </div>
            <form className='chat-form' onSubmit={handleSubmit}>
                <input type="text" name="message" placeholder="Enviar mensaje [SERVIDOR]" className='chat-input' />
                <button type="submit" className='chat-submit'>Enviar</button>
            </form>
        </Container>
    </section>
  )
}

export default Chat
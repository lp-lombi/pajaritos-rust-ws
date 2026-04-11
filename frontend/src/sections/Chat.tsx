import { useCallback, useEffect, useRef, useState } from 'react'
import Container from '../layout/Container'

import "./Chat.css"

function Chat() {

    const [log, setLog] = useState<string[]>([
        "El enano N: Buenas",
        "Lombi: Nos raidean",
        "El enano N: No se preocupen, tengo un plan",
        "Lombi: ¿Cuál es el plan?",
        "El enano N: Nos vamos a la casa de Lombi, ahí no nos van a encontrar",
        "Lombi: Buena idea, vamos",
        "El enano N: ¡Vamos!",
        "Lombi: ¡Estamos a salvo!",
        "El enano N: Sí, pero tenemos que estar atentos por si nos encuentran",
    ])

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

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const input = event.currentTarget.elements.namedItem('message') as HTMLInputElement
        const value = input.value.trim()

        if (value === '') {
            return
        }

        shouldStickToBottomRef.current = true
        setLog((previousLog) => [...previousLog, `SERVIDOR: ${value}`])
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
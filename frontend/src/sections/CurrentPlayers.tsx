import React, { useEffect } from 'react'
import Container from '../layout/Container'

import "./CurrentPlayers.css"

interface PlayerData {
    name: string;
    ping: number;
}

function CurrentPlayers() {
    const [players, setPlayers] = React.useState<PlayerData[]>([]);

    const updatePlayers = async () => {
        try {
            const response = await fetch('/api/rust/players');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (Array.isArray(data?.players)) {
                const validPlayers: PlayerData[] = data.players.map((p: string) => {
                    // el ping viene (90 ms). Ej: Pablo (90 ms)
                    const match = p.match(/^(.*)\s+\((\d+)\s*ms\)$/);
                    if (match) {
                        return {
                            name: match[1],
                            ping: parseInt(match[2], 10),
                        };
                    }
                })
                .filter((p: PlayerData | undefined): p is PlayerData => p !== undefined);
                setPlayers(validPlayers);
            }
        } catch (error) {
            console.error('Error obteniendo jugadores:', error);
        }
    }

    useEffect(() => {
        updatePlayers();
        const id = setInterval(updatePlayers, 5000);
        return () => clearInterval(id);
    }, []);

  return (
    <section className='current-players'>
        <Container>
            <h2>Jugadores ({players.length})</h2>
            <ul>
                {players.map((player, index) => (
                    <li key={index}>{player.name}</li>
                ))}
            </ul>
        </Container>
    </section>
  )
}

export default CurrentPlayers
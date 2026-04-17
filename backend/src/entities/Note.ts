import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Player } from './Player';

@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @Column()
    playerId: number;

    @ManyToOne(() => Player, (player) => player.notes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'playerId' })
    player: Player;
}

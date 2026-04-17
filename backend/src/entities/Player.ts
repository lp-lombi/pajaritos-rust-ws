import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { Subscription } from './Subscription';
import { Note } from './Note';

@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  steamid: string;

  @Column()
  tag: string;

  @OneToOne(() => Subscription, (subscription) => subscription.player)
  subscription?: Subscription;

  @OneToMany(() => Note, (note) => note.player)
  notes?: Note[];
}

import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Subscription } from './Subscription';

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
}

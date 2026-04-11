import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Player } from '../entities/Player';
import { Role } from '../entities/Role';
import { Subscription } from '../entities/Subscription';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true,
  logging: false,
  entities: [User, Player, Role, Subscription],
});

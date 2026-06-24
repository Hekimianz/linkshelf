import 'dotenv/config';
import { ClickEvent } from './src/analytics/click-event.entity';
import { Link } from './src/links/link.entity';
import { Profile } from './src/profiles/profile.entity';
import { User } from './src/users/user.entity';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Profile, Link, ClickEvent],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

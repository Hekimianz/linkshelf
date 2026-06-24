import { Link } from '../links/link.entity';
import { Profile } from '../profiles/profile.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('click_events')
export class ClickEvent {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Link)
  @JoinColumn({ name: 'link_id' })
  link!: Link;

  @Column()
  link_id!: string;

  @ManyToOne(() => Profile)
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @Column()
  profile_id!: string;

  @Column({ type: 'text', nullable: true })
  visitor_ip_hash!: string | null;

  @Column({ type: 'text', nullable: true })
  referrer!: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent!: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  country_code!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

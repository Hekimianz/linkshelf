import { Profile } from '../profiles/profile.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('links')
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  profile_id!: string;

  @Column()
  title!: string;

  @Column()
  url!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column()
  position!: number;

  @Column({ default: 0 })
  click_count!: number;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => Profile, (profile) => profile.links)
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;
}

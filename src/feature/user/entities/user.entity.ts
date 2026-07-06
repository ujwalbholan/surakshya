import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
@Index('idx_users_phone', ['phone'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  full_name: string;

  @Column({ length: 255, unique: true, nullable: true })
  email: string;

  @Column({ length: 30, unique: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  password_hash: string;

  @Column('text', { array: true, default: ['USER'] })
  roles: string[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  phone_verified: boolean;

  @Column({ type: 'uuid', nullable: true })
  station_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

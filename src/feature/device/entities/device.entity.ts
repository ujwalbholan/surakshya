import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  imei!: string;

  @Column({ nullable: true })
  label!: string;
}

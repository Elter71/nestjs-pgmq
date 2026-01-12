import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Hero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 0 })
  kills: number;
}

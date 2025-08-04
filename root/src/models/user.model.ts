import {Entity, model, property, hasMany} from '@loopback/repository';
import {Task} from './task.model';

@model({
  settings: {
    indexes: {
      uniqueUsername: {
        keys: {username: 1},
        options: {unique: true},
      },
    },
  },
})
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  username: string;



  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @hasMany(() => Task, {keyTo: 'username'})
  tasks: Task[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  tasks?: Task[];
}

export type UserWithRelations = User & UserRelations;

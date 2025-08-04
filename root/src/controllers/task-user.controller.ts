import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Task,
  User,
} from '../models';
import {TaskRepository} from '../repositories';

export class TaskUserController {
  constructor(
    @repository(TaskRepository)
    public taskRepository: TaskRepository,
  ) { }

  @get('/tasks/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to Task',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async getUser(
    @param.path.number('id') id: typeof Task.prototype.id,
  ): Promise<User> {
    return this.taskRepository.owner(id);
  }
}

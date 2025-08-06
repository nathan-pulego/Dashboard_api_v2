import {repository} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Task, User} from '../models';
import {TaskRepository, UserRepository} from '../repositories';

export class TaskController {
  constructor(
    @repository(TaskRepository)
    public taskRepository: TaskRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  @post('/users/{userId}/dashboard')
  @response(200, {
    description: 'Task model instance',
    content: {'application/json': {schema: getModelSchemaRef(Task)}},
  })
  async create(
    @param.path.number('userId') userId: typeof User.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTaskInDashboard',
            exclude: ['id', 'username'],
          }),
        },
      },
    })
    task: Omit<Task, 'id'>,
  ): Promise<Task> {
    const user = await this.userRepository.findById(userId);
    const taskToCreate = {...task, username: user.username};
    return this.taskRepository.create(taskToCreate);
  }

  @get('/users/{userId}/dashboard')
  @response(200, {
    description: 'Array of Task model instances for a specific user',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Task, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.path.number('userId') userId: number,
  ): Promise<Task[]> {
    const user = await this.userRepository.findById(userId);
    return this.taskRepository.find({where: {username: user.username}});
  }

  @patch('/users/{userId}/dashboard/{id}')
  @response(204, {
    description: 'Task PATCH success',
  })
  async updateById(
    @param.path.number('userId') userId: number,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {partial: true}),
        },
      },
    })
    task: Partial<Task>,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    const existingTask = await this.taskRepository.findById(id);
    if (existingTask.username === user.username) {
      await this.taskRepository.updateById(id, task);
    }
  }

  @del('/users/{userId}/dashboard/{id}')
  @response(204, {
    description: 'Task DELETE success',
  })
  async deleteById(
    @param.path.number('userId') userId: number,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    const existingTask = await this.taskRepository.findById(id);
    if (existingTask.username === user.username) {
      await this.taskRepository.deleteById(id);
    }
  }
}
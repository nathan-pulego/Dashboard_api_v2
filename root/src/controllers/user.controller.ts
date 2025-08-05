import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {inject} from '@loopback/core';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {User} from '../models';
import {UserRepository} from '../repositories';
import { PasswordHasher } from '../services';
export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject('services.HashPasswordService')
    public passwordHasher: PasswordHasher,
  ) {}

  @post('/users')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    // --- TEMPORARY DEBUG LOGGING ---
    // Use JSON.stringify to reveal any hidden whitespace before hashing.
    console.log('DEBUG: Hashing password for new user. Raw password received:', JSON.stringify(user.password));
    // --- END DEBUG LOGGING ---

    user.password = await this.passwordHasher.hashPassword(user.password);
      return this.userRepository.create(user);
  }

  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true, exclude: ['password']}),
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/users')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: Partial<User>,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    // For security, explicitly prevent password updates through the bulk update endpoint.
    // The `updateById` endpoint should be used for individual password changes.
    delete user.password;
    return this.userRepository.updateAll(user, where);
  }

  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true, exclude: ['password']}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: Partial<User>,
  ): Promise<void> {
    // In a PATCH, only hash the password if it's a new, non-empty string.
    // This prevents hashing an existing hash or nullifying the password.
    if (user.password && typeof user.password === 'string') {
      user.password = await this.passwordHasher.hashPassword(user.password);
    } else {
      // Don't modify the password if it's not provided in the PATCH request.
      delete user.password;
    }
    await this.userRepository.updateById(id, user);
  }

  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() user: User,
  ): Promise<void> {
    // A PUT request replaces the entire entity. It's crucial that the incoming password is plain text.
    // We must throw an error if the password is not a non-empty string.
    if (!user.password || typeof user.password !== 'string') {
      throw new HttpErrors.BadRequest('A valid password is required for user replacement.');
    }
    user.password = await this.passwordHasher.hashPassword(user.password);
    await this.userRepository.replaceById(id, user);
  }

  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRepository.deleteById(id);
  }
}

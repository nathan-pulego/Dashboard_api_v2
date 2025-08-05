import {repository} from '@loopback/repository';
import {post, requestBody, response, HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {UserRepository} from '../repositories';
import {User} from '../models';
import {PasswordHasher} from '../services';

export class AuthController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject('services.HashPasswordService') 
    public passwordHasher: PasswordHasher,
  ) {}

  @post('/auth/login')
  @response(200, {
    description: 'User login',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'},  
            userId: {type: 'number'},
            username: {type: 'string'},
          },
        },
      },
    },
  })

  async login(
    @requestBody() credentials: Pick<User, 'email' | 'password'>,
  ): Promise<{message: string; userId: number; username: string}> {
    const user = await this.userRepository.findOne({
      where: {email: credentials.email},
    });

    if (!user) {
      throw new HttpErrors.Unauthorized('Invalid username or password');
    }

    const passwordMatch = await this.passwordHasher.comparePassword(
      credentials.password,
      user.password,
    );

    if (!passwordMatch) {
      // This generic error message is a security best practice
      // to prevent attackers from guessing valid usernames.
      throw new HttpErrors.Unauthorized('Invalid username or password');
    }

    if (!user.id) {
      // This case should ideally not be reached if the user is found in the database.
      throw new HttpErrors.InternalServerError('User ID not found after authentication.');
    }

    return {
      message: 'Login successful',
      userId: user.id,
      username: user.username,
    };
  }
}

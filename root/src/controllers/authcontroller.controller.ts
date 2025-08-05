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
            username: {type: 'string'},
          },
        },
      },
    },
  })

  async login(
    @requestBody() credentials: Pick<User, 'email' | 'password'>,
  ): Promise<{message: string; username: string}> {
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
      // --- TEMPORARY DEBUG LOGGING ---
      // Use JSON.stringify to reveal any hidden whitespace. REMOVE in production.
      console.log('DEBUG: Login failed. Comparing provided password against stored hash.');
      console.log('Provided Email:', JSON.stringify(credentials.email)); // Changed from username
      console.log('Provided Password:', JSON.stringify(credentials.password)); // Changed from username
      // This generic error message is a security best practice
      // to prevent attackers from guessing valid usernames.
      throw new HttpErrors.Unauthorized('Invalid username or password');
    }

    return {
      message: 'Login successful',
      username: user.username,
    };
  }
}

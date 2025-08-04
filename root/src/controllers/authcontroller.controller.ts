import {repository} from '@loopback/repository';
import {post, requestBody, response, HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {UserRepository} from '../repositories';
import {HashPasswordService} from '../services/bcrpyt-hasher.service';
import {User} from '../models';

export class AuthController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject('services.HashPasswordService') 
    public passwordHasher: HashPasswordService, 
  ) {}

  @post('/auth/login')
  @response(200, {
    description: 'User login',
    content: {'application/json': {schema: {type: 'object'}}},
  })
  async login(
    @requestBody() credentials: Pick<User, 'username' | 'password'>,
  ) {
    const user = await this.userRepository.findOne({
      where: {username: credentials.username},
    });

    if (!user) {
      throw new HttpErrors.Unauthorized('Invalid username or password');
    }

    const passwordMatch = await this.passwordHasher.comparePassword(
      credentials.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new HttpErrors.Unauthorized('Invalid username or password');
    }

    return {
      message: 'Login successful',
      user: user.username,
    };
  }
}

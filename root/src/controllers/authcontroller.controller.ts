import {repository} from '@loopback/repository';
import {post, requestBody, response, HttpErrors, patch} from '@loopback/rest';
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

  @patch('/auth/login')
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
            isLoggedIn: {type: 'boolean'},
          },
        },
      },
    },
  })

  async login(
    @requestBody() credentials: Pick<User, 'email' | 'password'>,
  ): Promise<{message: string; userId: number; username: string; isLoggedIn: boolean;}> {
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

    user.isLoggedIn = true;
    await this.userRepository.updateById(user.id, user);

    if (!user.id) {
      // This case should ideally not be reached if the user is found in the database.
      throw new HttpErrors.InternalServerError('User ID not found after authentication.');
    }

    return {
      message: 'Login successful',
      userId: user.id,
      username: user.username,
      isLoggedIn: user.isLoggedIn,
    };
  }

  @patch('/auth/logout')
  @response(200, {
    description: 'User logout',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'},
            userId: {type: 'number'},
            username: {type: 'string'},
            isLoggedIn: {type: 'boolean'},
          },
        },
      },
    },
  })
  async logout(
    @requestBody() credentials: Pick<User, 'username'>,
  ): Promise<{message: string; userId: number; username: string; isLoggedIn: boolean;}> {
    const user = await this.userRepository.findOne({
      where: {username: credentials.username},
    });

    if (!user) {
      throw new HttpErrors.NotFound('User not found');
    }

    user.isLoggedIn = false;
    console.log('logged out user')
    await this.userRepository.updateById(user.id, user);

    if (user.id === undefined) {
      throw new HttpErrors.InternalServerError('User ID is undefined during logout.');
    }
    return {
      message: 'Logout successful',
      userId: user.id,
      username: user.username,
      isLoggedIn: user.isLoggedIn,
    };
  }

  @post('/auth/register')
  @response(200, {
    description: 'User registration',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'},
            userId: {type: 'number'},
            username: {type: 'string'},
            isLoggedIn: {type: 'boolean'},
          },
        },
      },
    },
  })
  async register(
    @requestBody() credentials: Pick<User, 'email' | 'username' | 'password'>,
  ): Promise<{message: string; userId: number; username: string; isLoggedIn: boolean;}> { 
    const existingUser = await this.userRepository.findOne({
      where: {
        or: [
          {username: credentials.username},
          {email: credentials.email},
        ],
      },
    });
    if (existingUser) {
      throw new HttpErrors.BadRequest('Username or email already exists');
    }


    const hashedPassword = await this.passwordHasher.hashPassword(credentials.password);

    const newUser = await this.userRepository.create({
      username: credentials.username,
      email: credentials.email,
      password: hashedPassword,
      isLoggedIn: false,
    });

    return {
      message: 'Registration successful',
      userId: newUser.id!,
      username: newUser.username,
      isLoggedIn: newUser.isLoggedIn,
    };
  }
}

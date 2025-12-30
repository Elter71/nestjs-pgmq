import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async register(@Body('email') email: string) {
    await this.usersService.register(email);
    return { status: 'success', message: 'User registered (transactionally)' };
  }
}

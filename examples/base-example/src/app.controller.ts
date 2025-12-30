import { Controller, Get } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller()
export class AppController {
  constructor(private readonly emailService: EmailService) {}

  @Get('/ok')
  async setMessage(): Promise<string> {
    await this.emailService.send();
    return 'OK';
  }

  @Get('/error')
  async setError(): Promise<string> {
    await this.emailService.sendError();
    return 'OK';
  }
}

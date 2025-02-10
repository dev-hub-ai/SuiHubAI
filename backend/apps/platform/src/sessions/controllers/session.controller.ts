import { Controller, Post, Session as SessionControl, Body, Get, Delete } from '@nestjs/common';
import * as secureSession from '@fastify/secure-session';
import { SessionService } from '@apps/platform/sessions/services';
import { InjectSessionService, Session } from '@apps/platform/sessions/decorators';
import { CreateSessionDto } from '@apps/platform/sessions/dto';
import { InjectUserService } from '@apps/platform/users/decorators';
import { UserService } from '@apps/platform/users/services';
import { SessionData } from '@apps/platform/sessions/types';

declare module '@fastify/secure-session' {
  interface SessionData {
    userId: string;
    organizationId: string;
  }
}

@Controller('sessions')
export default class SessionController {
  constructor(
    @InjectSessionService() private readonly sessionService: SessionService,
    @InjectUserService() private readonly userService: UserService,
  ) {}

  @Post('/nonce')
  public async createSessionNonce() {
    const nonce = await this.sessionService.generateNonce();

    return { nonce };
  }

  @Post('/')
  public async createSession(@SessionControl() session: secureSession.Session, @Body() body: CreateSessionDto) {
    const { organizationId, userId } = await this.sessionService.create({
      signature: body.signature,
      message: body.message,
      provider: body.provider,
    });

    session.set('userId', userId);
    session.set('organizationId', organizationId);

    return { success: true };
  }

  @Delete('/')
  public async logout(@SessionControl() session: secureSession.Session) {
    await session.delete();

    return { success: true };
  }

  @Get('/')
  public async getCurrentSession(@Session() session: SessionData) {
    if (session.userId === undefined) {
      return { sessionUser: null };
    }

    return { sessionUser: await this.userService.getById(session.userId) };
  }
}

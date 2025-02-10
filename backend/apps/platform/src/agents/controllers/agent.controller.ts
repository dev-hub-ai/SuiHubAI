import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Session } from '@apps/platform/sessions/decorators';
import { SessionData } from '@apps/platform/sessions/types';
import { SessionGuard } from '@apps/platform/sessions/guards';
import { AgentService } from '@apps/platform/agents/services';
import { InjectAgentService } from '@apps/platform/agents/decorators';
import { CreateAgentBodyDto, ListAgentsQueryDto, UpdateAgentBodyDto } from '@apps/platform/agents/dto';

@Controller('/agents')
@UseGuards(SessionGuard)
export default class AgentController {
  constructor(@InjectAgentService() private readonly agentService: AgentService) {}

  @Get('/')
  public listAgents(@Session() session: SessionData, @Query() query: ListAgentsQueryDto) {
    return this.agentService.listForTeam(query.teamId, session.organizationId);
  }

  @Get('/:id')
  public getAgentById(@Session() session: SessionData, @Param('id') id: string) {
    return this.agentService.getIfExist(id, session.organizationId);
  }

  @Post('/')
  public createAgent(@Session() session: SessionData, @Body() body: CreateAgentBodyDto) {
    return this.agentService.create({
      name: body.name,
      teamId: body.teamId,
      role: body.role,
      model: body.model,
      twitterCookie: body.twitterCookie,
      twitterUsername: body.twitterUsername,
      twitterPassword: body.twitterPassword,
      twitterEmail: body.twitterEmail,
      modelApiKey: body.modelApiKey,
      description: body.description,
      createdById: session.userId,
      organizationId: session.organizationId,
    });
  }

  @Put('/:id')
  public updateAgent(@Session() session: SessionData, @Param('id') id: string, @Body() body: UpdateAgentBodyDto) {
    return this.agentService.update(id, session.organizationId, {
      name: body.name,
      model: body.model,
      modelApiKey: body.modelApiKey,
      description: body.description,
      twitterCookie: body.twitterCookie,
      twitterUsername: body.twitterUsername,
      twitterPassword: body.twitterPassword,
      twitterEmail: body.twitterEmail,
      updatedById: session.userId,
    });
  }
}

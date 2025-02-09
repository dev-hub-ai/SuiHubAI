import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AgentTeamInteractionRepository, AgentTeamRepository } from '@apps/platform/agents/repositories';
import { AgentTeamInteractionEntityToDtoMapper } from '@apps/platform/agents/entities-mappers';
import { AgentTeamInteractionDto } from '@apps/platform/agents/dto';
import {
  InjectAgentService,
  InjectAgentTeamInteractionEntityToDtoMapper,
  InjectAgentTeamInteractionRepository,
  InjectAgentTeamRepository,
  InjectElizaApi,
} from '@apps/platform/agents/decorators';
import { AgentRole, AgentTeamInteractionStatus } from '@apps/platform/agents/enums';
import { ElizaApi } from '@apps/platform/agents/api';
import { AgentService } from './agent.service';

export interface CreateAgentTeamInteractionParams {
  title: string;
  requestContent: string;
  teamId: string;
  organizationId: string;
  createdById?: string;
}

export interface AgentTeamInteractionService {
  listByTeam(teamId: string, organizationId: string): Promise<AgentTeamInteractionDto[]>;
  get(id: string, organizationId: string): Promise<AgentTeamInteractionDto | null>;
  getIfExist(id: string, organizationId: string): Promise<AgentTeamInteractionDto>;
  create(params: CreateAgentTeamInteractionParams): Promise<AgentTeamInteractionDto>;
}

@Injectable()
export class DefaultAgentTeamInteractionService implements AgentTeamInteractionService {
  constructor(
    @InjectAgentTeamInteractionRepository()
    private readonly agentTeamInteractionRepository: AgentTeamInteractionRepository,
    @InjectAgentTeamRepository()
    private readonly agentTeamRepository: AgentTeamRepository,
    @InjectAgentService() private readonly agentService: AgentService,
    @InjectAgentTeamInteractionEntityToDtoMapper()
    private readonly agentTeamInteractionEntityToDtoMapper: AgentTeamInteractionEntityToDtoMapper,
    @InjectElizaApi() private readonly elizaApi: ElizaApi,
  ) {}

  public async listByTeam(teamId: string, organizationId: string): Promise<AgentTeamInteractionDto[]> {
    const entities = await this.agentTeamInteractionRepository.findMany({
      teamId,
      organizationId,
    });

    return this.agentTeamInteractionEntityToDtoMapper.mapMany(entities);
  }

  public async get(id: string, organizationId: string): Promise<AgentTeamInteractionDto> {
    const agentTeamInteractionEntity = await this.agentTeamInteractionRepository.findByIdAndOrganizationId(
      id,
      organizationId,
    );

    return agentTeamInteractionEntity && this.agentTeamInteractionEntityToDtoMapper.mapOne(agentTeamInteractionEntity);
  }

  public async getIfExist(id: string, organizationId: string): Promise<AgentTeamInteractionDto> {
    const agentTeamInteraction = await this.get(id, organizationId);

    if (!agentTeamInteraction) {
      throw new NotFoundException(`Agent team interaction with id ${id} not found`);
    }

    return agentTeamInteraction;
  }

  public async create(params: CreateAgentTeamInteractionParams): Promise<AgentTeamInteractionDto> {
    const team = await this.agentTeamRepository.findByIdAndOrganizationId(params.teamId, params.organizationId);

    if (!team) {
      throw new UnprocessableEntityException(`Team with id ${params.teamId} not found`);
    }

    const agents = await this.agentService.listForTeam(params.teamId, params.organizationId, [AgentRole.Producer]);

    if (!agents.length) {
      throw new UnprocessableEntityException('Team should have at least one producer.');
    }

    const entity = await this.agentTeamInteractionRepository.createOne({
      title: params.title,
      requestContent: params.requestContent,
      team: params.teamId,
      organization: params.organizationId,
      createdBy: params.createdById,
      status: AgentTeamInteractionStatus.New,
    });

    try {
      await this.elizaApi.sendAgentsCommunication({
        interactionId: entity.getId(),
        requestContent: entity.getRequestContent(),
        organizationId: entity.getOrganizationId(),
      });
    } catch (error) {
      console.error('Failed to send agents communication', error);
    }

    return this.agentTeamInteractionEntityToDtoMapper.mapOne(entity);
  }
}

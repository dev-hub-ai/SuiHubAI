import { AES, enc } from 'crypto-js';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectTransactionsManager } from '@libs/transactions/decorators';
import { TransactionsManager } from '@libs/transactions/managers';
import { AgentRepository, AgentTeamRepository } from '@apps/platform/agents/repositories';
import {
  InjectAgentRepository,
  InjectAgentEntityToDtoMapper,
  InjectAgentTeamRepository,
  InjectElizaApi,
} from '@apps/platform/agents/decorators';
import { AgentDto } from '@apps/platform/agents/dto';
import { AgentEntityToDtoMapper } from '@apps/platform/agents/entities-mappers';
import { AgentModel, AgentRole } from '@apps/platform/agents/enums';
import { ElizaApi } from '@apps/platform/agents/api';

export interface CreateAgentParams {
  role: AgentRole;
  organizationId: string;
  model: AgentModel;
  modelApiKey: string;
  teamId: string;
  name: string;
  twitterCookie?: string;
  twitterUsername?: string;
  createdById: string;
  description?: string;
}

export interface UpdateAgentParams {
  model?: AgentModel;
  modelApiKey?: string;
  twitterCookie?: string;
  twitterUsername?: string;
  name?: string;
  updatedById?: string | null;
  description?: string;
}

export interface AgentService {
  listForTeam(teamId: string, organizationId: string, roles?: AgentRole[]): Promise<AgentDto[]>;
  get(id: string, organizationId: string): Promise<AgentDto | null>;
  getIfExist(id: string, organizationId: string): Promise<AgentDto>;
  create(params: CreateAgentParams): Promise<AgentDto>;
  update(id: string, organizationId: string, params: UpdateAgentParams): Promise<AgentDto>;
}

@Injectable()
export class DefaultAgentService implements AgentService {
  constructor(
    @InjectAgentRepository() private readonly agentRepository: AgentRepository,
    @InjectAgentTeamRepository() private readonly agentTeamRepository: AgentTeamRepository,
    @InjectAgentEntityToDtoMapper() private agentEntityToDtoMapper: AgentEntityToDtoMapper,
    @InjectElizaApi() private elizaApi: ElizaApi,
    @InjectTransactionsManager() private transactionsManager: TransactionsManager,
  ) {}

  public async listForTeam(teamId: string, organizationId: string, roles?: AgentRole[]) {
    const agentEntities = await this.agentRepository.findMany({
      teamId,
      organizationId,
      roles,
    });

    return this.agentEntityToDtoMapper.mapMany(agentEntities);
  }

  public async get(id: string, organizationId: string) {
    const agentEntity = await this.agentRepository.findByIdAndOrganizationId(id, organizationId);

    return agentEntity && this.agentEntityToDtoMapper.mapOne(agentEntity);
  }

  public async getIfExist(id: string, organizationId: string) {
    const agent = await this.get(id, organizationId);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  public async create(params: CreateAgentParams) {
    const team = await this.agentTeamRepository.findByIdAndOrganizationId(params.teamId, params.organizationId);

    if (!team) {
      throw new UnprocessableEntityException('Provided Agent Team does not exist.');
    }

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const encryptionKey = process.env.WALLET_ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new Error('WALLET_ENCRYPTION_KEY environment variable is not set');
    }

    const encryptedPrivateKey = AES.encrypt(privateKey, encryptionKey).toString();

    const createdAgent = await this.transactionsManager.useTransaction(async () => {
      const agentsWithSameRole = await this.agentRepository.exists({
        organizationId: params.organizationId,
        teamId: params.teamId,
        role: params.role,
      });

      if (agentsWithSameRole) {
        throw new UnprocessableEntityException('Agent with the same role already exists.');
      }

      const agentEntity = await this.agentRepository.createOne({
        name: params.name,
        role: params.role,
        team: params.teamId,
        model: params.model,
        modelApiKey: params.modelApiKey,
        config: {
          twitterCookie: params.twitterCookie,
          twitterUsername: params.twitterUsername,
        },
        imageUrl: '',
        description: params.description,
        organization: params.organizationId,
        createdBy: params.createdById,
        updatedBy: params.createdById,
        walletAddress: account.address,
        encryptedPrivateKey: encryptedPrivateKey,
      });

      return this.agentEntityToDtoMapper.mapOne(agentEntity);
    });

    try {
      await this.elizaApi.sendAgentsChange({
        type: 'add',
        agent: createdAgent,
      });
    } catch (error) {
      console.error(error);
    }

    return createdAgent;
  }

  public async update(id: string, organizationId: string, params: UpdateAgentParams) {
    const updatedAgent = await this.transactionsManager.useTransaction(async () => {
      const existingAgent = await this.getIfExist(id, organizationId);

      const updatedAgentEntity = await this.agentRepository.updateOneById(id, {
        ...(params.name ? { name: params.name } : {}),
        ...(params.model ? { model: params.model } : {}),
        ...(params.modelApiKey ? { modelApiKey: params.modelApiKey } : {}),
        ...(params.description !== undefined ? { description: params.description } : {}),
        config: {
          twitterCookie: params.twitterCookie ?? (existingAgent.config.twitterCookie as string | undefined),
          twitterUsername: params.twitterUsername ?? (existingAgent.config.twitterUsername as string | undefined),
        },
        updatedBy: params.updatedById,
      });

      if (!updatedAgentEntity) {
        throw new NotFoundException('Agent not found.');
      }

      return this.agentEntityToDtoMapper.mapOne(updatedAgentEntity);
    });
    try {
      await this.elizaApi.sendAgentsChange({
        type: 'update',
        agent: updatedAgent,
      });
    } catch (error) {
      console.error(error);
    }

    return updatedAgent;
  }

  private decryptPrivateKey(encryptedPrivateKey: string): string {
    const encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('WALLET_ENCRYPTION_KEY environment variable is not set');
    }

    const bytes = AES.decrypt(encryptedPrivateKey, encryptionKey);
    return bytes.toString(enc.Utf8);
  }
}

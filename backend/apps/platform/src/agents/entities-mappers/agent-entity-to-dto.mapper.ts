import { Injectable } from '@nestjs/common';
import { AgentEntity } from '@apps/platform/agents/entities';
import { AgentDto } from '@apps/platform/agents/dto';

export interface AgentEntityToDtoMapper {
  mapOne(entity: AgentEntity): AgentDto;
  mapMany(entities: AgentEntity[]): AgentDto[];
}

@Injectable()
export class DefaultAgentEntityToDtoMapper implements AgentEntityToDtoMapper {
  public mapOne(entity: AgentEntity): AgentDto {
    return {
      id: entity.getId(),
      teamId: entity.getTeamId(),
      organizationId: entity.getOrganizationId(),
      name: entity.getName(),
      role: entity.getRole(),
      model: entity.getModel(),
      modelApiKey: entity.getModelApiKey(),
      config: entity.getConfig(),
      description: entity.getDescription(),
      imageUrl: entity.getImageUrl(),
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
      createdById: entity.getCreatedById(),
      updatedById: entity.getUpdatedById(),
      walletAddress: entity.getWalletAddress(),
    };
  }

  public mapMany(entities: AgentEntity[]): AgentDto[] {
    return entities.map((entity) => this.mapOne(entity));
  }
}

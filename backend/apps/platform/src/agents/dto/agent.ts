import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { IsIdentifier } from '@libs/validation/class-validators';
import { AnyObject } from '@libs/types';
import { AgentModel, AgentRole } from '@apps/platform/agents/enums';

export interface AgentDto {
  id: string;
  name: string;
  model: AgentModel;
  role: AgentRole;
  modelApiKey: string;
  config: AnyObject;
  teamId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  walletAddress: string;
  encryptedPrivateKey: string;
  description?: string;
  imageUrl?: string;
  createdById?: string | null;
  updatedById?: string | null;
}

export class ListAgentsQueryDto {
  @IsIdentifier()
  @IsNotEmpty()
  teamId: string;
}

export class CreateAgentBodyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(Object.values(AgentRole))
  @IsNotEmpty()
  role: AgentRole;

  @IsIdentifier()
  @IsNotEmpty()
  teamId: string;

  @IsIn(Object.values(AgentModel))
  @IsNotEmpty()
  model: AgentModel;

  @IsString()
  @IsNotEmpty()
  modelApiKey: string;

  @IsString()
  description?: string;

  @IsString()
  twitterCookie?: string;

  @IsString()
  twitterUsername?: string;
}

export class UpdateAgentBodyDto {
  @IsString()
  name?: string;

  @IsIn(Object.values(AgentModel))
  model?: AgentModel;

  @IsString()
  modelApiKey?: string;

  @IsString()
  description?: string;

  @IsString()
  twitterCookie?: string;

  @IsString()
  twitterUsername?: string;
}

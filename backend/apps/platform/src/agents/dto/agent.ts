import { IsIn, IsNotEmpty, IsString, IsOptional } from 'class-validator';
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

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  twitterCookie?: string;

  @IsOptional()
  @IsString()
  twitterUsername?: string;

  @IsOptional()
  @IsString()
  twitterPassword?: string;

  @IsOptional()
  @IsString()
  twitterEmail?: string;
}

export class UpdateAgentBodyDto {
  @IsString()
  name?: string;

  @IsIn(Object.values(AgentModel))
  model?: AgentModel;

  @IsOptional()
  @IsString()
  modelApiKey?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  twitterCookie?: string;

  @IsOptional()
  @IsString()
  twitterUsername?: string;

  @IsOptional()
  @IsString()
  twitterPassword?: string;

  @IsOptional()
  @IsString()
  twitterEmail?: string;
}

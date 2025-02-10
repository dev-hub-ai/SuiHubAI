import {Character, Clients, ModelProviderName} from "@elizaos/core";
import { advertiser } from "../characters/advertiser.ts";
import { influencer } from "../characters/influencer.ts";
import { producer } from "../characters/producer.ts";
import {AiOfficeCharacter} from "../agents/manager";

type AgentRole =  "advertiser" | "influencer" | "producer";

export interface AgentConfiguration {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  model: string;
  organizationId: string;
  teamId: string;
  modelApiKey: string;
  config: {
    twitterCookie?: string;
    twitterUsername?: string;
    twitterPassword?: string;
    twitterEmail?: string;
  };
}

const AVAILABLE_TEMPLATES = {
  advertiser,
  influencer,
  producer,
};

const getSecretsByModel = (model: string, modelApiKey: string) => {
  switch (model) {
    case ModelProviderName.OPENAI: {
      return {
        OPENAI_API_KEY: modelApiKey,
      };
    }
    case ModelProviderName.OPENROUTER: {
      return {
        OPENROUTER: modelApiKey,
      }
    }
    default: {
      return {};
    }
  }
};

export function generateCharacter(agentConfig: AgentConfiguration): AiOfficeCharacter {
  if (!AVAILABLE_TEMPLATES[agentConfig.role]) {
    throw new Error("Invalid role");
  }

  return {
    ...AVAILABLE_TEMPLATES[agentConfig.role],
    organizationId: agentConfig.organizationId,
    role: agentConfig.role,
    teamId: agentConfig.teamId,
    modelProvider: agentConfig.model as ModelProviderName,
    id: agentConfig.id as Character['id'],
    name: agentConfig.name,
    clients: agentConfig.role === 'producer' ? [] : [Clients.TWITTER],
    settings: {
      secrets: {
        TWITTER_COOKIES: agentConfig.config.twitterCookie,
        TWITTER_USERNAME: agentConfig.config.twitterUsername,
        TWITTER_PASSWORD: agentConfig.config.twitterPassword,
        TWITTER_EMAIL: agentConfig.config.twitterEmail,
        ...getSecretsByModel(agentConfig.model, agentConfig.modelApiKey),
      },
    },
  };
}

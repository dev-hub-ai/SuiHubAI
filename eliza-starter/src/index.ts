import {MongoClient, ObjectId} from "mongodb";
import {MongoDBDatabaseAdapter} from "@elizaos/adapter-mongodb";
import {DirectClient, DirectClientInterface} from "@elizaos/client-direct";
import {AutoClientInterface} from "@elizaos/client-auto";
import express from 'express';
import {
  AgentRuntime,
  CacheManager,
  Character,
  DbCacheAdapter,
  elizaLogger,
  IAgentRuntime,
  ICacheManager,
  IDatabaseAdapter,
  ModelProviderName,
  settings,
} from "@elizaos/core";
import {createNodePlugin} from "@elizaos/plugin-node";
import bodyParser from 'body-parser';
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {TwitterTopicProvider} from "./providers/twitterTopicProvider/index.ts";
import {agentsManager, AiOfficeAgentRuntime, AiOfficeCharacter} from "./agents/manager/index.ts";
import {configDotenv} from "dotenv";
import {TelegramClientInterface} from "@elizaos/client-telegram";
import {communicateWithAgents} from "./actions/communicate-agent/index.ts";
import {AgentConfiguration, generateCharacter} from "./utils/character-generator.ts";
import {sendInteractionToProducer, subscribeToAgentConversation} from "./utils/dialogue-system.ts";
import TwitterClientInterface from "./clients/client-twitter/index.ts";

const expressApp = express();

configDotenv();

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory


export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

export function getTokenForProvider(
  provider: ModelProviderName,
  character: Character
) {
  switch (provider) {
    case ModelProviderName.OPENAI:
      return (
        character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY
      );
    case ModelProviderName.LLAMACLOUD:
      return (
        character.settings?.secrets?.LLAMACLOUD_API_KEY ||
        settings.LLAMACLOUD_API_KEY ||
        character.settings?.secrets?.TOGETHER_API_KEY ||
        settings.TOGETHER_API_KEY ||
        character.settings?.secrets?.XAI_API_KEY ||
        settings.XAI_API_KEY ||
        character.settings?.secrets?.OPENAI_API_KEY ||
        settings.OPENAI_API_KEY
      );
    case ModelProviderName.ANTHROPIC:
      return (
        character.settings?.secrets?.ANTHROPIC_API_KEY ||
        character.settings?.secrets?.CLAUDE_API_KEY ||
        settings.ANTHROPIC_API_KEY ||
        settings.CLAUDE_API_KEY
      );
    case ModelProviderName.REDPILL:
      return (
        character.settings?.secrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY
      );
    case ModelProviderName.OPENROUTER:
      return (
        character.settings?.secrets?.OPENROUTER || settings.OPENROUTER_API_KEY
      );
    case ModelProviderName.GROK:
      return character.settings?.secrets?.GROK_API_KEY || settings.GROK_API_KEY;
    case ModelProviderName.HEURIST:
      return (
        character.settings?.secrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY
      );
    case ModelProviderName.GROQ:
      return character.settings?.secrets?.GROQ_API_KEY || settings.GROQ_API_KEY;
  }
}

export function initializeDatabaseClient() {
  const DATABASE_URL = process.env.MONGODB_URL || "";

  return new MongoClient(DATABASE_URL);
}

export async function initializeClients(
  character: Character,
  runtime: IAgentRuntime,
) {
  const clients = [];
  const clientTypes = character.clients?.map((str) => str.toLowerCase()) || [];

  if (clientTypes.includes('auto')) {
    const autoClient = await AutoClientInterface.start(runtime);

    if (autoClient) {
      clients.push(autoClient);
    }
  }

  if (clientTypes.includes("telegram")) {
    const telegramClient = await TelegramClientInterface.start(runtime);

    if (telegramClient) {
      clients.push(telegramClient);
    }
  }

  if (clientTypes.includes("twitter")) {
     const twitterClients = await TwitterClientInterface.start(runtime)

     clients.push(twitterClients);
  }

  if (clientTypes.includes("direct")) {
    const directClient = await DirectClientInterface.start(runtime);

    clients.push(directClient);
  }

  if (character.plugins?.length > 0) {
    for (const plugin of character.plugins) {
      if (plugin.clients) {
        for (const client of plugin.clients) {
          clients.push(await client.start(runtime));
        }
      }
    }
  }

  return clients;
}

let nodePlugin: any | undefined;

export function createAgent(
  character: AiOfficeCharacter,
  db: IDatabaseAdapter,
  cache: ICacheManager,
  token: string
): AiOfficeAgentRuntime {
  elizaLogger.success(
    elizaLogger.successesTitle,
    "Creating runtime for character",
    character.name
  );

  nodePlugin ??= createNodePlugin();

  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: character.modelProvider,
    evaluators: [],
    character,
    plugins: [nodePlugin],
    providers: [new TwitterTopicProvider()],
    actions: [communicateWithAgents],
    services: [],
    managers: [],
    cacheManager: cache,
  }) as AiOfficeAgentRuntime;
}

async function startAgent(
  character: AiOfficeCharacter,
  database: MongoDBDatabaseAdapter,
) {
  try {
    const token = getTokenForProvider(character.modelProvider, character);

    const cache = new CacheManager(new DbCacheAdapter(database, character.id));

    const runtime = createAgent(character, database as IDatabaseAdapter, cache, token);

    agentsManager.addAgent(runtime.agentId, runtime);

    await runtime.initialize();

    const cookies = runtime.getSetting('TWITTER_COOKIES');
    const username = runtime.getSetting('TWITTER_USERNAME');

    if (cookies) {
      elizaLogger.log(`Reading cookies from SETTINGS...`);

      await runtime.cacheManager.set(
        `twitter/${username}/cookies`,
        JSON.parse(cookies),
      );
    }

    return initializeClients(character, runtime);
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error
    );

    throw error;
  }
}

const killAgent = async (agentId: string) => {
  try {
    const agent = agentsManager.getAgent(agentId);

    await agent.stop();

    agentsManager.removeAgent(agentId);

    elizaLogger.success(`Agent stopped: ${agentId}`);
  } catch (error) {
    elizaLogger.error(`Failed to stop agent: ${agentId}`);
  }
};

const verifySecretKey = (secretKey: string) => {
  return secretKey === process.env.ELIZA_API_SECRET_KEY;
};

const initializeExpressApp = (elizaMongodbAdapter: MongoDBDatabaseAdapter) => {
  expressApp.get('/health', (request, response) => {
    response.status(200).send('OK');
  });

  expressApp.post(
    '/agents/change',
    bodyParser.json({}),
    async (request, response) => {
      const {
        type,
        agent,
        secretKey,
      } = request.body as {
        type: 'add' | 'remove' | 'update';
        agent: AgentConfiguration;
        secretKey: string;
      };

      if (!verifySecretKey(secretKey)) {
        response.status(401).send({ status: 'Unauthorized' });

        return;
      }

      if (type === 'add') {
        await startAgent(generateCharacter(agent), elizaMongodbAdapter);
      }

      if (type === 'remove') {
        await killAgent(agent.id);
      }

      if (type === 'update') {
        await killAgent(agent.id);
        await startAgent(generateCharacter(agent), elizaMongodbAdapter);
      }

      response.status(200).send({ status: 'OK' });
    },
  );

  expressApp.post(
    '/agents/communicate',
    bodyParser.json({}),
    async (request, response) => {
      const {
        requestContent,
        interactionId,
        organizationId,
        secretKey,
      } = request.body as {
        title: string;
        requestContent: string;
        interactionId: string;
        teamId: string;
        organizationId: string;
        secretKey: string;
      };

      if (!verifySecretKey(secretKey)) {
        response.status(401).send({ status: 'Unauthorized' });

        return;
      }

      sendInteractionToProducer(
        interactionId,
        organizationId,
        requestContent,
      ).catch((error) => {
        console.error("Error sending interaction to producer:", error);
      });

      response.status(200).send({ status: 'OK' });
    },
  );

  expressApp.listen(process.env.EXPRESS_APP_PORT || 3001, () => {
    console.log(`Express app is running on port ${process.env.EXPRESS_APP_PORT || 3001}`);
  });
};

const initializeAgentsSystem = async () => {
  const dataDir = path.join(__dirname, "../data");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const databaseClient = initializeDatabaseClient();

  const databaseName = process.env.MONGODB_NAME || 'ai-office';

  const elizaMongodbAdapter = new MongoDBDatabaseAdapter(
    databaseClient,
    databaseName,
  );

  await elizaMongodbAdapter.init();

  const database = databaseClient.db(databaseName);

  initializeExpressApp(elizaMongodbAdapter);
  subscribeToAgentConversation(database);

  const agentConfigurations = await database.collection('agents').find<{
    _id: ObjectId;
    name: string;
    role: 'advertiser' | 'influencer' | 'producer';
    organization: ObjectId;
    team: ObjectId;
    description?: string;
    model: string;
    modelApiKey: string;
    encryptedPrivateKey: string;
    walletAddress: string;
    config: {
      twitterCookie?: string;
      twitterName?: string;
    };
  }>({}).toArray();

  for (const agentConfiguration of agentConfigurations) {
    const character = generateCharacter({
      id: agentConfiguration._id.toString(),
      name: agentConfiguration.name,
      role: agentConfiguration.role,
      teamId: agentConfiguration.team.toString(),
      walletAddress: agentConfiguration.walletAddress,
      encryptedPrivateKey: agentConfiguration.encryptedPrivateKey,
      organizationId: agentConfiguration.organization.toString(),
      description: agentConfiguration.description,
      model: agentConfiguration.model,
      modelApiKey: agentConfiguration.modelApiKey,
      config: agentConfiguration.config,
    });

    await startAgent(character, elizaMongodbAdapter);
  }
};

initializeAgentsSystem().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);

  if (error instanceof Error) {
    console.error(error.stack);
  }
});

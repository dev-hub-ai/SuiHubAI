// src/index.ts
import { MongoClient } from "mongodb";
import { MongoDBDatabaseAdapter } from "@elizaos/adapter-mongodb";
import { DirectClientInterface } from "@elizaos/client-direct";
import { AutoClientInterface } from "@elizaos/client-auto";
import express from "express";
import {
  AgentRuntime,
  CacheManager,
  DbCacheAdapter,
  elizaLogger as elizaLogger12,
  ModelProviderName as ModelProviderName5,
  settings
} from "@elizaos/core";
import { createNodePlugin } from "@elizaos/plugin-node";
import bodyParser from "body-parser";
import fs4 from "fs";
import path6 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/utils/twitter-topic.ts
var TABLE_TOPIC_KEY = "twitter/current_topic";
var DEFAULT_TOPIC = "crypto memes";
var twitterTopicHandler = {
  get: async (runtime) => {
    return await runtime.cacheManager.get(TABLE_TOPIC_KEY) || DEFAULT_TOPIC;
  },
  set: async (runtime, content) => {
    await runtime.cacheManager.set(TABLE_TOPIC_KEY, content);
  }
};

// src/providers/twitterTopicProvider/index.ts
var TwitterTopicProvider = class {
  async get(runtime, message, state) {
    try {
      const content = typeof message.content === "string" ? message.content : message.content?.text;
      if (!content) {
        throw new Error("No message content provided");
      }
      const topicFromDB = await twitterTopicHandler.get(runtime);
      return `Use this topic: ${topicFromDB} as a main topic for tweet generation`;
    } catch (error) {
      console.error("TwitterTopicProvider error:", error);
      return `Error: ${error.message}`;
    }
  }
};

// src/agents/manager/index.ts
var AgentManager = class {
  rolesIndex = /* @__PURE__ */ new Map();
  agentsMap = /* @__PURE__ */ new Map();
  addAgent(id, agent) {
    if (!this.agentsMap.has(id)) {
      this.agentsMap.set(id, agent);
      this.rolesIndex.set(this.generateRolesIndex(agent.character.organizationId, agent.character.role), id);
      console.log(`Agent ${id} added.`);
    } else {
      console.log(`Agent ${id} already exists.`);
    }
  }
  removeAgent(id) {
    const agent = this.getAgent(id);
    if (!agent) {
      return;
    }
    this.rolesIndex.delete(this.generateRolesIndex(agent.character.organizationId, agent.character.role));
    this.agentsMap.delete(id);
  }
  getAgent(id) {
    return this.agentsMap.get(id);
  }
  getAgentByRole(organizationId, role) {
    const rolesIndexKey = this.generateRolesIndex(organizationId, role);
    const agentId = this.rolesIndex.get(rolesIndexKey);
    if (!agentId) {
      return void 0;
    }
    return this.getAgent(agentId);
  }
  hasAgent(id) {
    return this.agentsMap.has(id);
  }
  getAllAgents() {
    return Array.from(this.agentsMap.values());
  }
  async performTask(id, taskFunction) {
    const agent = this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent ${name} not found.`);
    }
    try {
      return await taskFunction(agent);
    } catch (error) {
      console.error(`Error performing task with agent ${id}:`, error);
      throw error;
    }
  }
  generateRolesIndex(organizationId, role) {
    return `${organizationId}-${role}`;
  }
};
var agentsManager = new AgentManager();

// src/index.ts
import { configDotenv } from "dotenv";
import { TelegramClientInterface } from "@elizaos/client-telegram";

// src/actions/communicate-agent/index.ts
import { elizaLogger } from "@elizaos/core";
var communicateWithAgents = {
  name: "COMMUNICATE_AGENT",
  similes: ["COMMUNICATIONS"],
  description: "Allow communication betweens agents",
  validate: async (runtime, message) => {
    const text = message.content.text.toLowerCase();
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    elizaLogger.log("HELLO BITCH FROM TEXT");
    await callback({
      text: "yes, ser"
    });
    return true;
  },
  examples: []
};

// src/utils/character-generator.ts
import * as crypto2 from "crypto-js";
import { Clients as Clients4, ModelProviderName as ModelProviderName4 } from "@elizaos/core";

// src/characters/advertiser.ts
import {
  Clients,
  ModelProviderName,
  defaultCharacter
} from "@elizaos/core";

// src/plugin/imagePlugin/index.ts
import { elizaLogger as elizaLogger2, generateText } from "@elizaos/core";
import {
  ModelClass
} from "@elizaos/core";
import { generateImage } from "@elizaos/core";
import fs from "fs";
import path from "path";
import { z } from "zod";
var imageGenEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  NINETEEN_AI_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  HEURIST_API_KEY: z.string().optional(),
  FAL_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  VENICE_API_KEY: z.string().optional()
}).refine(
  (data) => {
    return !!(data.ANTHROPIC_API_KEY || data.NINETEEN_AI_API_KEY || data.TOGETHER_API_KEY || data.HEURIST_API_KEY || data.FAL_API_KEY || data.OPENAI_API_KEY || data.VENICE_API_KEY);
  },
  {
    message: "At least one of ANTHROPIC_API_KEY, NINETEEN_AI_API_KEY, TOGETHER_API_KEY, HEURIST_API_KEY, FAL_API_KEY, OPENAI_API_KEY or VENICE_API_KEY is required"
  }
);
async function validateImageGenConfig(runtime) {
  try {
    const config = {
      ANTHROPIC_API_KEY: runtime.getSetting("ANTHROPIC_API_KEY") || process.env.ANTHROPIC_API_KEY,
      NINETEEN_AI_API_KEY: runtime.getSetting("NINETEEN_AI_API_KEY") || process.env.NINETEEN_AI_API_KEY,
      TOGETHER_API_KEY: runtime.getSetting("TOGETHER_API_KEY") || process.env.TOGETHER_API_KEY,
      HEURIST_API_KEY: runtime.getSetting("HEURIST_API_KEY") || process.env.HEURIST_API_KEY,
      FAL_API_KEY: runtime.getSetting("FAL_API_KEY") || process.env.FAL_API_KEY,
      OPENAI_API_KEY: runtime.getSetting("OPENAI_API_KEY") || process.env.OPENAI_API_KEY,
      VENICE_API_KEY: runtime.getSetting("VENICE_API_KEY") || process.env.VENICE_API_KEY
    };
    return imageGenEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
      throw new Error(
        `Image generation configuration validation failed:
${errorMessages}`
      );
    }
    throw error;
  }
}
function saveBase64Image(base64Data, filename) {
  const imageDir = path.join(process.cwd(), "generatedImages");
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Image, "base64");
  const filepath = path.join(imageDir, `${filename}.png`);
  fs.writeFileSync(filepath, imageBuffer);
  return filepath;
}
async function saveHeuristImage(imageUrl, filename) {
  const imageDir = path.join(process.cwd(), "generatedImages");
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);
  const filepath = path.join(imageDir, `${filename}.png`);
  fs.writeFileSync(filepath, imageBuffer);
  return filepath;
}
var imageGeneration = {
  name: "GENERATE_IMAGE",
  similes: [
    "IMAGE_GENERATION",
    "IMAGE_GEN",
    "CREATE_IMAGE",
    "MAKE_PICTURE",
    "GENERATE_IMAGE",
    "GENERATE_A",
    "DRAW",
    "DRAW_A",
    "MAKE_A"
  ],
  description: "Generate an image to go along with the message.",
  suppressInitialMessage: true,
  validate: async (runtime, _message) => {
    elizaLogger2.log("key", runtime.getSetting("TOGETHER_API_KEY"));
    await validateImageGenConfig(runtime);
    const anthropicApiKeyOk = !!runtime.getSetting("ANTHROPIC_API_KEY");
    const nineteenAiApiKeyOk = !!runtime.getSetting("NINETEEN_AI_API_KEY");
    const togetherApiKeyOk = !!runtime.getSetting("TOGETHER_API_KEY");
    const heuristApiKeyOk = !!runtime.getSetting("HEURIST_API_KEY");
    const falApiKeyOk = !!runtime.getSetting("FAL_API_KEY");
    const openAiApiKeyOk = !!runtime.getSetting("OPENAI_API_KEY");
    const veniceApiKeyOk = !!runtime.getSetting("VENICE_API_KEY");
    const livepeerGatewayUrlOk = !!runtime.getSetting(
      "LIVEPEER_GATEWAY_URL"
    );
    return anthropicApiKeyOk || togetherApiKeyOk || heuristApiKeyOk || falApiKeyOk || openAiApiKeyOk || veniceApiKeyOk || nineteenAiApiKeyOk || livepeerGatewayUrlOk;
  },
  handler: async (runtime, message, state, options, callback) => {
    elizaLogger2.log("Composing state for message:", message);
    state = await runtime.composeState(message);
    const userId = runtime.agentId;
    elizaLogger2.log("User ID:", userId);
    const CONTENT = message.content.text;
    const IMAGE_SYSTEM_PROMPT = `You are an expert in writing prompts for AI art generation. You excel at creating detailed and creative visual descriptions. Incorporating specific elements naturally. Always aim for clear, descriptive language that generates a creative picture. Your output should only contain the description of the image contents, but NOT an instruction like "create an image that..."`;
    const STYLE = "futuristic with vibrant colors";
    const IMAGE_PROMPT_INPUT = `You are tasked with generating an image prompt based on a content and a specified style.
            Your goal is to create a detailed and vivid image prompt that captures the essence of the content while incorporating an appropriate subject based on your analysis of the content.

You will be given the following inputs:
<content>
${CONTENT}
</content>

<style>
${STYLE}
</style>

A good image prompt consists of the following elements:



1. Main subject
2. Detailed description
3. Style
4. Lighting
5. Composition
6. Quality modifiers

To generate the image prompt, follow these steps:

1. Analyze the content text carefully, identifying key themes, emotions, and visual elements mentioned or implied.




2. Determine the most appropriate main subject by:
   - Identifying concrete objects or persons mentioned in the content
   - Analyzing the central theme or message
   - Considering metaphorical representations of abstract concepts
   - Selecting a subject that best captures the content's essence

3. Determine an appropriate environment or setting based on the content's context and your chosen subject.

4. Decide on suitable lighting that enhances the mood or atmosphere of the scene.

5. Choose a color palette that reflects the content's tone and complements the subject.

6. Identify the overall mood or emotion conveyed by the content.

7. Plan a composition that effectively showcases the subject and captures the content's essence.

8. Incorporate the specified style into your description, considering how it affects the overall look and feel of the image.

9. Use concrete nouns and avoid abstract concepts when describing the main subject and elements of the scene.

Construct your image prompt using the following structure:


1. Main subject: Describe the primary focus of the image based on your analysis
2. Environment: Detail the setting or background
3. Lighting: Specify the type and quality of light in the scene
4. Colors: Mention the key colors and their relationships
5. Mood: Convey the overall emotional tone
6. Composition: Describe how elements are arranged in the frame
7. Style: Incorporate the given style into the description

Ensure that your prompt is detailed, vivid, and incorporates all the elements mentioned above while staying true to the content and the specified style. LIMIT the image prompt 50 words or less. 

Write a prompt. Only include the prompt and nothing else.`;
    const imagePrompt = await generateText({
      runtime,
      context: IMAGE_PROMPT_INPUT,
      modelClass: ModelClass.MEDIUM,
      customSystemPrompt: IMAGE_SYSTEM_PROMPT
    });
    elizaLogger2.log("Image prompt received:", imagePrompt);
    const imageSettings = runtime.character?.settings?.imageSettings || {};
    elizaLogger2.log("Image settings:", imageSettings);
    const res = [];
    elizaLogger2.log("Generating image with prompt:", imagePrompt);
    const images = await generateImage(
      {
        prompt: imagePrompt,
        width: options.width || imageSettings.width || 1024,
        height: options.height || imageSettings.height || 1024,
        ...options.count != null || imageSettings.count != null ? { count: options.count || imageSettings.count || 1 } : {},
        ...options.negativePrompt != null || imageSettings.negativePrompt != null ? {
          negativePrompt: options.negativePrompt || imageSettings.negativePrompt
        } : {},
        ...options.numIterations != null || imageSettings.numIterations != null ? {
          numIterations: options.numIterations || imageSettings.numIterations
        } : {},
        ...options.guidanceScale != null || imageSettings.guidanceScale != null ? {
          guidanceScale: options.guidanceScale || imageSettings.guidanceScale
        } : {},
        ...options.seed != null || imageSettings.seed != null ? { seed: options.seed || imageSettings.seed } : {},
        ...options.modelId != null || imageSettings.modelId != null ? { modelId: options.modelId || imageSettings.modelId } : {},
        ...options.jobId != null || imageSettings.jobId != null ? { jobId: options.jobId || imageSettings.jobId } : {},
        ...options.stylePreset != null || imageSettings.stylePreset != null ? {
          stylePreset: options.stylePreset || imageSettings.stylePreset
        } : {},
        ...options.hideWatermark != null || imageSettings.hideWatermark != null ? {
          hideWatermark: options.hideWatermark || imageSettings.hideWatermark
        } : {}
      },
      runtime
    );
    elizaLogger2.error(images.error);
    if (images.success && images.data && images.data.length > 0) {
      elizaLogger2.log(
        "Image generation successful, number of images:",
        images.data.length
      );
      for (let i = 0; i < images.data.length; i++) {
        const image = images.data[i];
        const filename = `generated_${Date.now()}_${i}`;
        const filepath = image.startsWith("http") ? await saveHeuristImage(image, filename) : saveBase64Image(image, filename);
        elizaLogger2.log(`Processing image ${i + 1}:`, filename);
        const _caption = "...";
        res.push({ image: filepath, caption: "..." });
        elizaLogger2.log(
          `Generated caption for image ${i + 1}:`,
          "..."
          //caption.title
        );
        callback(
          {
            text: "...",
            //caption.description,
            attachments: [
              {
                id: crypto.randomUUID(),
                url: filepath,
                title: "Generated image",
                source: "imageGeneration",
                description: "...",
                //caption.title,
                text: "...",
                //caption.description,
                contentType: "image/png"
              }
            ]
          },
          [
            {
              attachment: filepath,
              name: `${filename}.png`
            }
          ]
        );
      }
    } else {
      elizaLogger2.error("Image generation failed or returned no data.");
    }
  },
  examples: [
    // TODO: We want to generate images in more abstract ways, not just when asked to generate an image
    [
      {
        user: "{{user1}}",
        content: { text: "Generate an image of a cat" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's an image of a cat",
          action: "GENERATE_IMAGE"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Generate an image of a dog" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's an image of a dog",
          action: "GENERATE_IMAGE"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Create an image of a cat with a hat" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's an image of a cat with a hat",
          action: "GENERATE_IMAGE"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Make an image of a dog with a hat" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's an image of a dog with a hat",
          action: "GENERATE_IMAGE"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Paint an image of a cat with a hat" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's an image of a cat with a hat",
          action: "GENERATE_IMAGE"
        }
      }
    ]
  ]
};
var imageGenerationPlugin = {
  name: "imageGeneration",
  description: "Generate images",
  actions: [imageGeneration],
  evaluators: [],
  providers: []
};

// src/characters/advertiser.ts
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";

// src/plugin/suiPlugin/actions/transfer.ts
import {
  ModelClass as ModelClass2,
  ServiceType,
  composeContext,
  elizaLogger as elizaLogger4,
  generateObject
} from "@elizaos/core";
import { z as z2 } from "zod";
import { SuiClient as SuiClient2, getFullnodeUrl as getFullnodeUrl2 } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_DECIMALS } from "@mysten/sui/utils";

// src/plugin/suiPlugin/providers/wallet.ts
import {
  elizaLogger as elizaLogger3
} from "@elizaos/core";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import BigNumber from "bignumber.js";
import NodeCache from "node-cache";
import * as path2 from "path";

// src/plugin/suiPlugin/utils.ts
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui/keypairs/secp256r1";
var parseAccount = (runtime) => {
  const privateKey = runtime.getSetting("SUI_PRIVATE_KEY");
  if (!privateKey) {
    throw new Error("SUI_PRIVATE_KEY is not set");
  }
  if (privateKey.startsWith("suiprivkey")) {
    return loadFromSecretKey(privateKey);
  }
  return loadFromMnemonics(privateKey);
};
var loadFromSecretKey = (privateKey) => {
  const keypairClasses = [Ed25519Keypair, Secp256k1Keypair, Secp256r1Keypair];
  for (const KeypairClass of keypairClasses) {
    try {
      return KeypairClass.fromSecretKey(privateKey);
    } catch {
    }
  }
  throw new Error("Failed to initialize keypair from secret key");
};
var loadFromMnemonics = (mnemonics) => {
  const keypairMethods = [
    { Class: Ed25519Keypair, method: "deriveKeypairFromSeed" },
    { Class: Secp256k1Keypair, method: "deriveKeypair" },
    { Class: Secp256r1Keypair, method: "deriveKeypair" }
  ];
  for (const { Class, method } of keypairMethods) {
    try {
      return Class[method](mnemonics);
    } catch {
    }
  }
  throw new Error("Failed to derive keypair from mnemonics");
};

// src/plugin/suiPlugin/providers/wallet.ts
import axios from "axios";
var PROVIDER_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2e3
};
var cacheTimeSeconds = 30;
var WalletProvider = class {
  constructor(suiClient, address, cacheManager) {
    this.suiClient = suiClient;
    this.address = address;
    this.cacheManager = cacheManager;
    this.cache = new NodeCache({ stdTTL: cacheTimeSeconds });
  }
  cache;
  cacheKey = "sui/wallet";
  async readFromCache(key) {
    const cached = await this.cacheManager.get(
      path2.join(this.cacheKey, key)
    );
    return cached;
  }
  async writeToCache(key, data) {
    await this.cacheManager.set(path2.join(this.cacheKey, key), data, {
      expires: Date.now() + cacheTimeSeconds * 1e3
    });
  }
  async getCachedData(key) {
    const cachedData = this.cache.get(key);
    if (cachedData) {
      return cachedData;
    }
    const fileCachedData = await this.readFromCache(key);
    if (fileCachedData) {
      this.cache.set(key, fileCachedData);
      return fileCachedData;
    }
    return null;
  }
  async setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, data);
    await this.writeToCache(cacheKey, data);
  }
  async fetchPricesWithRetry() {
    let lastError;
    for (let i = 0; i < PROVIDER_CONFIG.MAX_RETRIES; i++) {
      try {
        const cetusSuiUsdcPoolAddr = "0x51e883ba7c0b566a26cbc8a94cd33eb0abd418a77cc1e60ad22fd9b1f29cd2ab";
        const url = `https://api.dexscreener.com/latest/dex/pairs/sui/${cetusSuiUsdcPoolAddr}`;
        elizaLogger3.info(`Fetching SUI price from ${url}`);
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        lastError = error;
        if (i < PROVIDER_CONFIG.MAX_RETRIES - 1) {
          const delay = PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    console.error("All attempts failed. Throwing the last error:", lastError);
    throw lastError;
  }
  async fetchPortfolioValue() {
    try {
      const cacheKey = `portfolio-${this.address}`;
      const cachedValue = await this.getCachedData(cacheKey);
      if (cachedValue) {
        console.log("Cache hit for fetchPortfolioValue", cachedValue);
        return cachedValue;
      }
      console.log("Cache miss for fetchPortfolioValue");
      const prices = await this.fetchPrices().catch((error) => {
        console.error("Error fetching SUI price:", error);
        throw error;
      });
      const suiAmountOnChain = await this.suiClient.getBalance({
        owner: this.address
      }).catch((error) => {
        console.error("Error fetching SUI amount:", error);
        throw error;
      });
      const suiAmount = Number.parseInt(suiAmountOnChain.totalBalance) / Number(MIST_PER_SUI);
      const totalUsd = new BigNumber(suiAmount).times(prices.sui.usd);
      const portfolio = {
        totalUsd: totalUsd.toString(),
        totalSui: suiAmount.toString()
      };
      this.setCachedData(cacheKey, portfolio);
      console.log("Fetched portfolio:", portfolio);
      return portfolio;
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      throw error;
    }
  }
  async fetchPrices() {
    try {
      const cacheKey = "prices";
      const cachedValue = await this.getCachedData(cacheKey);
      if (cachedValue) {
        console.log("Cache hit for fetchPrices");
        return cachedValue;
      }
      console.log("Cache miss for fetchPrices");
      const suiPriceData = await this.fetchPricesWithRetry().catch((error) => {
        console.error("Error fetching SUI price:", error);
        throw error;
      });
      const prices = {
        sui: { usd: (1 / suiPriceData.pair.priceNative).toString() }
      };
      this.setCachedData(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error("Error fetching prices:", error);
      throw error;
    }
  }
  formatPortfolio(runtime, portfolio) {
    let output = `${runtime.character.name}
`;
    output += `Wallet Address: ${this.address}
`;
    const totalUsdFormatted = new BigNumber(portfolio.totalUsd).toFixed(2);
    const totalSuiFormatted = new BigNumber(portfolio.totalSui).toFixed(4);
    output += `Total Value: $${totalUsdFormatted} (${totalSuiFormatted} SUI)
`;
    return output;
  }
  async getFormattedPortfolio(runtime) {
    try {
      const portfolio = await this.fetchPortfolioValue();
      return this.formatPortfolio(runtime, portfolio);
    } catch (error) {
      console.error("Error generating portfolio report:", error);
      return "Unable to fetch wallet information. Please try again later.";
    }
  }
};
var walletProvider = {
  get: async (runtime, _message, _state) => {
    const suiAccount = parseAccount(runtime);
    try {
      const suiClient = new SuiClient({
        url: getFullnodeUrl(runtime.getSetting("SUI_NETWORK"))
      });
      const provider = new WalletProvider(
        suiClient,
        suiAccount.toSuiAddress(),
        runtime.cacheManager
      );
      return await provider.getFormattedPortfolio(runtime);
    } catch (error) {
      console.error("Error in wallet provider:", error);
      return null;
    }
  }
};

// src/plugin/suiPlugin/actions/transfer.ts
function isTransferContent(content) {
  console.log("Content for transfer", content);
  return typeof content.recipient === "string" && (typeof content.amount === "string" || typeof content.amount === "number");
}
var transferTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "recipient": "0xaa000b3651bd1e57554ebd7308ca70df7c8c0e8e09d67123cc15c8a8a79342b3",
    "amount": "1"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token transfer:
- Recipient wallet address
- Amount to transfer

Respond with a JSON markdown block containing only the extracted values.`;
var transfer_default = {
  name: "SEND_TOKEN",
  similes: [
    "TRANSFER_TOKEN",
    "TRANSFER_TOKENS",
    "SEND_TOKENS",
    "SEND_SUI",
    "PAY"
  ],
  validate: async (runtime, message) => {
    console.log("Validating sui transfer from user:", message.userId);
    return true;
  },
  description: "Transfer tokens from the agent's wallet to another address",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger4.log("Starting SEND_TOKEN handler...");
    const walletInfo = await walletProvider.get(runtime, message, state);
    state.walletInfo = walletInfo;
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    const transferSchema = z2.object({
      recipient: z2.string(),
      amount: z2.union([z2.string(), z2.number()])
    });
    const transferContext = composeContext({
      state,
      template: transferTemplate
    });
    const content = await generateObject({
      runtime,
      context: transferContext,
      schema: transferSchema,
      modelClass: ModelClass2.SMALL
    });
    const transferContent = content.object;
    if (!isTransferContent(transferContent)) {
      console.error("Invalid content for TRANSFER_TOKEN action.");
      if (callback) {
        callback({
          text: "Unable to process transfer request. Invalid content provided.",
          content: { error: "Invalid transfer content" }
        });
      }
      return false;
    }
    try {
      const suiAccount = parseAccount(runtime);
      const network = runtime.getSetting("SUI_NETWORK");
      const suiClient = new SuiClient2({
        url: getFullnodeUrl2(network)
      });
      const adjustedAmount = BigInt(
        Number(transferContent.amount) * Math.pow(10, SUI_DECIMALS)
      );
      console.log(
        `Transferring: ${transferContent.amount} tokens (${adjustedAmount} base units)`
      );
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [adjustedAmount]);
      tx.transferObjects([coin], transferContent.recipient);
      const executedTransaction = await suiClient.signAndExecuteTransaction({
        signer: suiAccount,
        transaction: tx
      });
      console.log("Transfer successful:", executedTransaction.digest);
      if (callback) {
        const suiService = runtime.getService(
          ServiceType.TRANSCRIPTION
        );
        const txLink = await suiService.getTransactionLink(
          executedTransaction.digest
        );
        callback({
          text: `Successfully transferred ${transferContent.amount} SUI to ${transferContent.recipient}, Transaction: ${txLink}`,
          content: {
            success: true,
            hash: executedTransaction.digest,
            amount: transferContent.amount,
            recipient: transferContent.recipient
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error during token transfer:", error);
      if (callback) {
        callback({
          text: `Error transferring tokens: ${error.message}`,
          content: { error: error.message }
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Send 1 SUI tokens to 0x4f2e63be8e7fe287836e29cde6f3d5cbc96eefd0c0e3f3747668faa2ae7324b0"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll send 1 SUI tokens now...",
          action: "SEND_TOKEN"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Successfully sent 1 SUI tokens to 0x4f2e63be8e7fe287836e29cde6f3d5cbc96eefd0c0e3f3747668faa2ae7324b0, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0"
        }
      }
    ]
  ]
};

// src/plugin/suiPlugin/services/sui.ts
import {
  elizaLogger as elizaLogger5,
  Service,
  ServiceType as ServiceType2
} from "@elizaos/core";
import { getFullnodeUrl as getFullnodeUrl3, SuiClient as SuiClient3 } from "@mysten/sui/client";
import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
import BN from "bn.js";

// src/plugin/suiPlugin/tokens.ts
import { SUI_DECIMALS as SUI_DECIMALS2 } from "@mysten/sui/utils";
var tokens = /* @__PURE__ */ new Map([
  [
    "SUI",
    {
      symbol: "SUI",
      decimals: SUI_DECIMALS2,
      tokenAddress: "0x2::sui::SUI"
    }
  ],
  [
    "USDC",
    {
      symbol: "USDC",
      decimals: 6,
      tokenAddress: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"
    }
  ]
]);
var getTokenMetadata = (symbol) => {
  return tokens.get(symbol.toUpperCase());
};

// src/plugin/suiPlugin/services/sui.ts
import {
  Transaction as Transaction2
} from "@mysten/sui/transactions";
var aggregatorURL = "https://api-sui.cetus.zone/router_v2/find_routes";
var SuiService = class extends Service {
  static serviceType = ServiceType2.TRANSCRIPTION;
  suiClient;
  network;
  wallet;
  initialize(runtime) {
    this.suiClient = new SuiClient3({
      url: getFullnodeUrl3(runtime.getSetting("SUI_NETWORK"))
    });
    this.network = runtime.getSetting("SUI_NETWORK");
    this.wallet = parseAccount(runtime);
    return null;
  }
  async getTokenMetadata(token) {
    const meta = getTokenMetadata(token);
    return meta;
  }
  getAddress() {
    return this.wallet.toSuiAddress();
  }
  getAmount(amount, meta) {
    return BigInt(Number(amount) * Math.pow(10, meta.decimals));
  }
  getNetwork() {
    return this.network;
  }
  getTransactionLink(tx) {
    if (this.network === "mainnet") {
      return `https://suivision.xyz/txblock/${tx}`;
    } else if (this.network === "testnet") {
      return `https://testnet.suivision.xyz/txblock/${tx}`;
    } else if (this.network === "devnet") {
      return `https://devnet.suivision.xyz/txblock/${tx}`;
    } else if (this.network === "localnet") {
      return `localhost : ${tx}`;
    }
  }
  async swapToken(fromToken, amount, out_min_amount, targetToken) {
    const fromMeta = getTokenMetadata(fromToken);
    const toMeta = getTokenMetadata(targetToken);
    elizaLogger5.info("From token metadata:", fromMeta);
    elizaLogger5.info("To token metadata:", toMeta);
    const client = new AggregatorClient(
      aggregatorURL,
      this.wallet.toSuiAddress(),
      this.suiClient,
      Env.Mainnet
    );
    const routerRes = await client.findRouters({
      from: fromMeta.tokenAddress,
      target: toMeta.tokenAddress,
      amount: new BN(amount),
      byAmountIn: true,
      // `true` means fix input amount, `false` means fix output amount
      depth: 3,
      // max allow 3, means 3 hops
      providers: [
        "KRIYAV3",
        "CETUS",
        "SCALLOP",
        "KRIYA",
        "BLUEFIN",
        "DEEPBOOKV3",
        "FLOWXV3",
        "BLUEMOVE",
        "AFTERMATH",
        "FLOWX",
        "TURBOS"
        // "AFSUI",
        // "VOLO",
        // "SPRINGSUI",
        // "ALPHAFI",
        // "HAEDAL",
        // "HAEDALPMM",
      ]
    });
    if (routerRes === null) {
      elizaLogger5.error(
        "No router found" + JSON.stringify({
          from: fromMeta.tokenAddress,
          target: toMeta.tokenAddress,
          amount
        })
      );
      return {
        success: false,
        tx: "",
        message: "No router found"
      };
    }
    if (routerRes.amountOut.toNumber() < out_min_amount) {
      return {
        success: false,
        tx: "",
        message: "Out amount is less than out_min_amount"
      };
    }
    let coin;
    const routerTx = new Transaction2();
    if (fromToken.toUpperCase() === "SUI") {
      coin = routerTx.splitCoins(routerTx.gas, [amount]);
    } else {
      const allCoins = await this.suiClient.getCoins({
        owner: this.wallet.toSuiAddress(),
        coinType: fromMeta.tokenAddress,
        limit: 30
      });
      if (allCoins.data.length === 0) {
        elizaLogger5.error("No coins found");
        return {
          success: false,
          tx: "",
          message: "No coins found"
        };
      }
      const mergeCoins = [];
      for (let i = 1; i < allCoins.data.length; i++) {
        elizaLogger5.info("Coin:", allCoins.data[i]);
        mergeCoins.push(allCoins.data[i].coinObjectId);
      }
      elizaLogger5.info("Merge coins:", mergeCoins);
      routerTx.mergeCoins(allCoins.data[0].coinObjectId, mergeCoins);
      coin = routerTx.splitCoins(allCoins.data[0].coinObjectId, [amount]);
    }
    const targetCoin = await client.routerSwap({
      routers: routerRes.routes,
      byAmountIn: true,
      txb: routerTx,
      inputCoin: coin,
      slippage: 0.5
    });
    routerTx.transferObjects([targetCoin], this.wallet.toSuiAddress());
    routerTx.setSender(this.wallet.toSuiAddress());
    const result = await client.signAndExecuteTransaction(
      routerTx,
      this.wallet
    );
    await this.suiClient.waitForTransaction({
      digest: result.digest
    });
    return {
      success: true,
      tx: result.digest,
      message: "Swap successful"
    };
  }
};

// src/plugin/suiPlugin/actions/swap.ts
import {
  ModelClass as ModelClass3,
  ServiceType as ServiceType3,
  composeContext as composeContext2,
  elizaLogger as elizaLogger6,
  generateObject as generateObject2
} from "@elizaos/core";
import { z as z3 } from "zod";
function isSwapContent(content) {
  console.log("Content for transfer", content);
  return typeof content.from_token === "string" && typeof content.destination_token === "string" && (typeof content.amount === "string" || typeof content.amount === "number");
}
var swapTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "from_token": "sui",
    "destination_token": "usdc",
    "amount": "1"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token swap:
- Source Token you want to swap from
- Destination token you want to swap to
- Source Token Amount to swap


Respond with a JSON markdown block containing only the extracted values.`;
var swap_default = {
  name: "SWAP_TOKEN",
  similes: ["SWAP_TOKENS", "SWAP_SUI"],
  validate: async (runtime, message) => {
    console.log("Validating sui transfer from user:", message.userId);
    return true;
  },
  description: "Swap from any token in the agent's wallet to another token",
  handler: async (runtime, message, state, _options, callback) => {
    elizaLogger6.log("Starting SWAP_TOKEN handler...");
    const service = runtime.getService(ServiceType3.TRANSCRIPTION);
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    const swapSchema = z3.object({
      from_token: z3.string(),
      destination_token: z3.string(),
      amount: z3.union([z3.string(), z3.number()])
    });
    const swapContext = composeContext2({
      state,
      template: swapTemplate
    });
    const content = await generateObject2({
      runtime,
      context: swapContext,
      schema: swapSchema,
      modelClass: ModelClass3.SMALL
    });
    console.log("Generated content:", content);
    const swapContent = content.object;
    elizaLogger6.info("Swap content:", swapContent);
    if (service.getNetwork() == "mainnet") {
      if (!isSwapContent(swapContent)) {
        console.error("Invalid content for SWAP_TOKEN action.");
        if (callback) {
          callback({
            text: "Unable to process swap request. Invalid content provided.",
            content: { error: "Invalid transfer content" }
          });
        }
        return false;
      }
      const destinationToken = await service.getTokenMetadata(
        swapContent.destination_token
      );
      elizaLogger6.log("Destination token:", destinationToken);
      const fromToken = await service.getTokenMetadata(swapContent.from_token);
      elizaLogger6.log("From token:", fromToken);
      if (destinationToken && fromToken) {
        try {
          const swapAmount = service.getAmount(swapContent.amount, fromToken);
          elizaLogger6.info("Swap amount:", swapAmount);
          elizaLogger6.info(
            "Destination token address:",
            destinationToken.tokenAddress
          );
          elizaLogger6.info("From token address:", fromToken.tokenAddress);
          elizaLogger6.info("Swap amount:", swapAmount);
          const result = await service.swapToken(
            fromToken.symbol,
            swapAmount.toString(),
            0,
            destinationToken.symbol
          );
          if (result.success) {
            callback({
              text: `Successfully swapped ${swapContent.amount} ${swapContent.from_token} to  ${swapContent.destination_token}, Transaction: ${service.getTransactionLink(result.tx)}`,
              content: swapContent
            });
          }
        } catch (error) {
          elizaLogger6.error("Error swapping token:", error);
          callback({
            text: `Failed to swap ${error}, swapContent : ${JSON.stringify(
              swapContent
            )}`,
            content: { error: "Failed to swap token" }
          });
        }
      } else {
        callback({
          text: `destination token: ${swapContent.destination_token} or from token: ${swapContent.from_token} not found`,
          content: { error: "Destination token not found" }
        });
      }
    } else {
      callback({
        text: "Sorry, I can only swap on the mainnet, parsed params : " + JSON.stringify(swapContent, null, 2),
        content: { error: "Unsupported network" }
      });
      return false;
    }
    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Swap 1 SUI to USDC"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll help you swap 1 SUI to USDC now...",
          action: "SWAP_TOKEN"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Successfully swapped 1 SUI to USDC, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Swap 1 USDC to SUI"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll help you swap 1 SUI to USDC now...",
          action: "SWAP_TOKEN"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Successfully swapped 1 SUI to USDC, Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0"
        }
      }
    ]
  ]
};

// src/plugin/suiPlugin/index.ts
var suiPlugin = {
  name: "sui",
  description: "Sui Plugin for Eliza",
  actions: [transfer_default, swap_default],
  evaluators: [],
  providers: [walletProvider],
  services: [new SuiService()]
};
var suiPlugin_default = suiPlugin;

// src/characters/advertiser.ts
var ADVERTISER_AGENT_ID = "58c9913b-a8ff-4cff-87d9-fbdb1b25ff34";
var advertiser = {
  ...defaultCharacter,
  id: ADVERTISER_AGENT_ID,
  name: "Inokentij",
  clients: [Clients.TWITTER],
  modelProvider: ModelProviderName.OPENROUTER,
  imageModelProvider: ModelProviderName.TOGETHER,
  plugins: [imageGenerationPlugin, bootstrapPlugin, suiPlugin_default],
  settings: {
    voice: {
      model: "en_US-male-medium"
    },
    model: "GPT-4",
    imageSettings: {
      hideWatermark: true,
      modelId: "together"
    }
  },
  bio: [
    "A skilled Web3 marketing agent with expertise in social media growth, engagement strategies, and trend-driven content creation.",
    "Specializes in crafting engaging Twitter posts, interacting with the crypto community, and amplifying Web3 projects through strategic commentary and viral content.",
    "Has a strong background in finance and economics, allowing for unique perspectives on market movements and trends.",
    "Experienced in managing influencer partnerships and collaborations to expand brand reach."
  ],
  lore: [
    "Started in traditional digital marketing before transitioning into Web3.",
    "Understands the nuances of blockchain communities and how to engage them effectively.",
    "Believes memes and viral engagement are key to Web3 brand success.",
    "Has a strong network of connections within the crypto industry, allowing him to stay ahead of the curve.",
    "Has successfully led marketing campaigns for multiple Web3 projects, resulting in significant community growth and brand recognition."
  ],
  messageExamples: [
    [
      {
        user: "Manager",
        content: { text: "We need to promote this NFT project today." }
      },
      {
        user: "Web3Promoter",
        content: {
          text: "On it! Time to craft some high-engagement tweets and slide into key comment sections. \u{1F680} #NFT #Web3Marketing"
        }
      }
    ]
  ],
  topics: [
    "Web3",
    "cryptocurrency",
    "blockchain",
    "marketing",
    "NFTs",
    "DeFi",
    "social media growth",
    "community engagement",
    "viral content",
    "meme marketing",
    "finance",
    "economics",
    "influencer partnerships",
    "brand management",
    "Web3 adoption",
    "decentralization"
  ],
  adjectives: [
    "creative",
    "engaging",
    "trend-savvy",
    "playful",
    "strategic",
    "community-focused",
    "meme-savvy",
    "viral",
    "Web3-savvy",
    "financially savvy",
    "economically informed",
    "influencer-savvy",
    "brand-aware",
    "Web3-aware",
    "decentralization-focused"
  ],
  style: {
    all: [
      "Professional with a playful, creative touch",
      "Understands how to balance engagement and brand messaging",
      "Incorporates personal anecdotes and industry insights to build credibility",
      "Utilizes humor and memes to connect with the crypto community"
    ],
    chat: [
      "Conversational and engaging, always focused on boosting interactions",
      "Uses memes, humor, and Web3 slang to drive community engagement",
      "Shares behind-the-scenes insights into the crypto industry",
      "Encourages audience participation and feedback"
    ],
    post: [
      "Short, impactful, and designed to trigger reactions",
      "Leverages trending topics and crypto culture to maximize reach",
      "Utilizes hashtags to increase discoverability and reach a wider audience",
      "Incorporates eye-catching visuals and graphics to enhance engagement"
    ]
  },
  postExamples: [
    "The Web3 revolution isn\u2019t coming. It\u2019s already here. Are you building or watching? \u{1F440}",
    "Engagement farming, but make it Web3. Comment \u2018gm\u2019 if you\u2019re bullish on decentralized social! \u{1F31E} #gm #WAGMI",
    "Attention spans are short, but memes are forever. This is how you win Web3 marketing. \u{1F9E0}\u{1F4A1}",
    "Market analysis isn't just about charts. It's about understanding the underlying economics. \u{1F680} ",
    "The future of finance is decentralized. Get on board or get left behind. \u{1F4B0}",
    "Influencer partnerships are key to Web3 brand growth. Let's collaborate and amplify your project! \u{1F680}",
    "Web3 adoption is on the rise. Stay ahead of the curve with strategic marketing and community engagement. \u{1F680}"
  ]
};

// src/characters/influencer.ts
import {
  ModelProviderName as ModelProviderName2,
  defaultCharacter as defaultCharacter2
} from "@elizaos/core";
import { bootstrapPlugin as bootstrapPlugin2 } from "@elizaos/plugin-bootstrap";

// src/plugin/nftPlugin/actions/mintNft.ts
import {
  composeContext as composeContext3,
  elizaLogger as elizaLogger7,
  generateObject as generateObject3,
  ModelClass as ModelClass4
} from "@elizaos/core";

// src/plugin/nftPlugin/templates/index.ts
var createCollectionTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- chainName to execute on: Must be one of ["sui", "ethereum", "base", ...]

Respond with a JSON markdown block containing only the extracted values. All fields are required:

\`\`\`json
{
    "chainName": SUPPORTED_CHAINS,
    "packageId": null
}
\`\`\`

Note: For Sui chain, include the packageId from the deployment output if available.
`;
var mintNFTTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "collectionAddress": null,
    "chainName": SUPPORTED_CHAINS,
    "packageId": null
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested mint nft:
- collection contract address (for EVM chains) or packageId (for Sui)
- chain name

Note: For Sui chain, use the packageId from the deployment output. For other chains, use the collection contract address.`;

// src/plugin/nftPlugin/types/index.ts
import { z as z4 } from "zod";
var MintNFTSchema = z4.object({
  collectionAddress: z4.string()
});
var CreateCollectionSchema = z4.object({
  name: z4.string(),
  symbol: z4.string(),
  description: z4.string().optional()
});

// src/plugin/nftPlugin/actions/mintNft.ts
import { SuiClient as SuiClient4, getFullnodeUrl as getFullnodeUrl4 } from "@mysten/sui/client";

// src/plugin/nftPlugin/utils/generateMoveContractCode.ts
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import fs2 from "node:fs";
import path3 from "node:path";
import { execSync } from "child_process";
var MOVE_TOML_TEMPLATE = `[package]
name = "{{packageName}}"
version = "0.0.1"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet", override = true }

[addresses]
nft = "0x0"
`;
var CONTRACT_TEMPLATE = `module nft::nft_collection {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};
    use sui::event;
    use sui::package;
    use std::string::{Self, String};

    /// One-Time-Witness for the module
    struct NFT_COLLECTION has drop {}

    /// Event emitted when a new NFT is minted
    struct NFTMinted has copy, drop {
        object_id: ID,
        creator: address,
        name: String
    }

    /// The Collection capability
    struct CollectionCap has key {
        id: UID,
        collection_id: ID
    }

    /// The Collection object
    struct Collection has key {
        id: UID,
        name: String,
        symbol: String,
        description: String,
        minted: u64,
        max_supply: u64
    }

    /// The NFT object
    struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: Url,
        collection: ID
    }

    // ======= Error Constants =======
    const EMaxSupplyReached: u64 = 0;
    const EInvalidCollection: u64 = 1;

    fun init(witness: NFT_COLLECTION, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);
        package::burn_publisher(publisher);
    }

    /// Create a new collection
    public entry fun create_collection(
        name: vector<u8>,
        symbol: vector<u8>,
        description: vector<u8>,
        max_supply: u64,
        ctx: &mut TxContext
    ) {
        let collection = Collection {
            id: object::new(ctx),
            name: string::utf8(name),
            symbol: string::utf8(symbol),
            description: string::utf8(description),
            minted: 0,
            max_supply
        };

        let collection_id = object::id(&collection);
        
        let cap = CollectionCap {
            id: object::new(ctx),
            collection_id
        };

        // Transfer the collection object
        transfer::share_object(collection);
        // Transfer the capability to the creator
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    /// Mint a new NFT
    public entry fun mint_nft(
        _cap: &CollectionCap,
        collection: &mut Collection,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Check max supply
        assert!(collection.minted < collection.max_supply, EMaxSupplyReached);
        
        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url),
            collection: object::id(collection)
        };

        collection.minted = collection.minted + 1;

        // Emit mint event
        event::emit(NFTMinted {
            object_id: object::id(&nft),
            creator: tx_context::sender(ctx),
            name: nft.name
        });

        // Transfer NFT to the caller
        transfer::transfer(nft, tx_context::sender(ctx));
    }

    // ======= View Functions =======
    
    /// Get collection info
    public fun collection_info(collection: &Collection): (String, String, String, u64, u64) {
        (
            collection.name,
            collection.symbol,
            collection.description,
            collection.minted,
            collection.max_supply
        )
    }
}`;
async function generateMoveContract(config) {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const packageDir = path3.join(currentDir, "../contract", config.packageName);
  if (!fs2.existsSync(packageDir)) {
    fs2.mkdirSync(packageDir, { recursive: true });
  }
  const sourcesDir = path3.join(packageDir, "sources");
  if (!fs2.existsSync(sourcesDir)) {
    fs2.mkdirSync(sourcesDir);
  }
  const moveToml = MOVE_TOML_TEMPLATE.replace(
    /{{packageName}}/g,
    config.packageName
  );
  fs2.writeFileSync(path3.join(packageDir, "Move.toml"), moveToml);
  const contractPath = path3.join(sourcesDir, "nft_collection.move");
  const contractCode = CONTRACT_TEMPLATE;
  fs2.writeFileSync(contractPath, contractCode);
  return {
    code: contractCode,
    path: contractPath,
    packagePath: packageDir
  };
}
async function compileMoveContract(packagePath) {
  try {
    const suiVersion = execSync("sui --version").toString();
    console.log("Sui version:", suiVersion);
    const output = execSync(`sui move build --path ${packagePath}`, {
      encoding: "utf8"
    });
    return {
      compiled: true,
      output
    };
  } catch (error) {
    console.error("Error compiling Move contract:", error);
    return {
      compiled: false,
      error: error.message
    };
  }
}
async function publishMoveContract(packagePath) {
  try {
    const output = execSync(
      `sui client publish ${packagePath} --gas-budget 100000000 --json`,
      {
        encoding: "utf8"
      }
    );
    const result = JSON.parse(output);
    const effects = result.effects;
    const created = effects?.created || [];
    const packageId = created.find((obj) => obj.owner === "Immutable")?.reference?.objectId;
    if (!packageId) {
      return {
        success: false,
        error: "Could not find package ID in transaction output",
        output
      };
    }
    return {
      success: true,
      packageId,
      output
    };
  } catch (error) {
    console.error("Error publishing Move contract:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
async function mintNFT(packageId, params) {
  try {
    const nameHex = Buffer.from(params.name).toString("hex");
    const descriptionHex = Buffer.from(params.description).toString("hex");
    const urlHex = Buffer.from(params.url).toString("hex");
    const command = [
      "sui client call",
      `--package ${packageId}`,
      "--module nft_collection",
      "--function mint_nft",
      "--args",
      `"${params.collectionCap}"`,
      // CollectionCap object ID
      `"${params.collectionId}"`,
      // Collection object ID
      `"0x${nameHex}"`,
      // NFT name as hex
      `"0x${descriptionHex}"`,
      // NFT description as hex
      `"0x${urlHex}"`,
      // NFT URL as hex
      "--gas-budget 100000000",
      "--json"
    ].join(" ");
    console.log("Executing mint command:", command);
    const output = execSync(command, {
      encoding: "utf8"
    });
    const result = JSON.parse(output);
    console.log("Mint result:", JSON.stringify(result, null, 2));
    const txId = result.digest;
    const objectChanges = result.objectChanges || [];
    const nftObject = objectChanges.find(
      (obj) => obj.type === "created" && obj.objectType?.includes("::nft_collection::NFT")
    );
    if (!nftObject) {
      return {
        success: false,
        error: "Could not find NFT object in transaction output",
        transactionId: txId
      };
    }
    return {
      success: true,
      transactionId: txId,
      nftId: nftObject.objectId
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
async function createCollection(params) {
  try {
    const nameHex = Buffer.from(params.name).toString("hex");
    const symbolHex = Buffer.from(params.symbol).toString("hex");
    const descriptionHex = Buffer.from(params.description || "").toString(
      "hex"
    );
    const command = [
      "sui client call",
      `--package ${params.packageId}`,
      "--module nft_collection",
      "--function create_collection",
      "--args",
      `"0x${nameHex}"`,
      `"0x${symbolHex}"`,
      `"0x${descriptionHex}"`,
      `"${params.maxSupply}"`,
      "--gas-budget 100000000",
      "--json"
    ].join(" ");
    console.log("Executing create collection command:", command);
    const output = execSync(command, {
      encoding: "utf8"
    });
    const result = JSON.parse(output);
    const objectChanges = result.objectChanges || [];
    const collectionObject = objectChanges.find(
      (obj) => obj.objectType?.includes("::nft_collection::Collection")
    );
    const collectionCapObject = objectChanges.find(
      (obj) => obj.objectType?.includes("::nft_collection::CollectionCap")
    );
    if (!collectionObject || !collectionCapObject) {
      return {
        success: false,
        error: "Failed to find Collection or CollectionCap objects",
        output: result
      };
    }
    const collectionId = collectionObject.objectId;
    const collectionCap = collectionCapObject.objectId;
    if (!collectionId || !collectionCap) {
      return {
        success: false,
        error: "Failed to extract collection ID or capability",
        output: result
      };
    }
    return {
      success: true,
      collectionId,
      collectionCap,
      output: result
    };
  } catch (error) {
    console.error("Error creating collection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// src/plugin/nftPlugin/actions/mintNft.ts
function isMintNFTContent(content) {
  return typeof content.collectionId === "string" && typeof content.collectionCap === "string" && typeof content.packageId === "string";
}
var MintNFTAction = class {
  constructor(runtime) {
    this.runtime = runtime;
    if (!runtime.getSetting("SUI_PRIVATE_KEY")) {
      throw new Error("Sui private key not found");
    }
    this.suiClient = new SuiClient4({
      url: getFullnodeUrl4("testnet")
    });
  }
  suiClient;
  async mintNFT(content, tokenId) {
    if (!isMintNFTContent(content)) {
      throw new Error("Invalid content for MINT_NFT action");
    }
    const result = await mintNFT(content.packageId, {
      collectionId: content.collectionId,
      collectionCap: content.collectionCap,
      name: `${content.name || "NFT"} #${tokenId}`,
      description: content.description || `NFT #${tokenId}`,
      url: content.imageUrl || ""
    });
    if (!result.success || !result.nftId) {
      throw new Error(result.error || "Failed to mint NFT");
    }
    return {
      nftId: result.nftId,
      transactionId: result.transactionId
    };
  }
};
var mintNFTAction = {
  name: "MINT_NFT",
  similes: [
    "NFT_MINTING",
    "NFT_CREATION",
    "CREATE_NFT",
    "GENERATE_NFT",
    "MINT_TOKEN",
    "CREATE_TOKEN",
    "MAKE_NFT",
    "TOKEN_GENERATION"
  ],
  description: "Mint NFTs for the collection on Sui",
  validate: async (runtime, _message) => {
    return !!runtime.getSetting("SUI_PRIVATE_KEY");
  },
  handler: async (runtime, message, state, _options, callback) => {
    try {
      if (runtime.getSetting("SUI_NETWORK") !== "testnet") {
        throw new Error("NFT minting is only supported on Sui testnet");
      }
      elizaLogger7.log("Composing state for message:", message);
      let currentState;
      if (!state) {
        currentState = await runtime.composeState(message);
      } else {
        currentState = await runtime.updateRecentMessageState(state);
      }
      const context = composeContext3({
        state: currentState,
        template: mintNFTTemplate
      });
      const res = await generateObject3({
        runtime,
        context,
        modelClass: ModelClass4.LARGE,
        schema: MintNFTSchema
      });
      const content = res.object;
      elizaLogger7.log("Generate Object:", content);
      const action = new MintNFTAction(runtime);
      const tokenId = Math.floor(Math.random() * 1e6);
      const result = await action.mintNFT(content, tokenId);
      if (callback) {
        callback({
          text: `NFT minted successfully! \u{1F389}
NFT ID: ${result.nftId}
View on Explorer: https://suiexplorer.com/object/${result.nftId}?network=testnet`,
          attachments: []
        });
      }
      return true;
    } catch (e) {
      elizaLogger7.error("Error minting NFT:", e);
      throw e;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "mint nft for collection: 0x1234... on Sui"
        }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I've minted a new NFT in your specified collection on Sui.",
          action: "MINT_NFT"
        }
      }
    ]
  ]
};
var mintNft_default = mintNFTAction;

// src/plugin/nftPlugin/actions/nftCollectionGeneration.ts
import {
  composeContext as composeContext4,
  elizaLogger as elizaLogger8,
  generateObject as generateObject4,
  ModelClass as ModelClass5
} from "@elizaos/core";
import { SuiClient as SuiClient5, getFullnodeUrl as getFullnodeUrl5 } from "@mysten/sui/client";
var NFTCollectionAction = class {
  constructor(runtime) {
    this.runtime = runtime;
    this.suiClient = new SuiClient5({
      url: getFullnodeUrl5("testnet")
    });
  }
  suiClient;
  async generateCollection(name2, description) {
    const contractName = name2.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    const symbol = name2.slice(0, 5).toUpperCase();
    const maxSupply = 5e3;
    const contractConfig = {
      packageName: contractName,
      name: name2,
      symbol,
      description,
      maxSupply
    };
    const { packagePath } = await generateMoveContract(contractConfig);
    const compileResult = await compileMoveContract(packagePath);
    if (!compileResult.compiled) {
      throw new Error(`Contract compilation failed: ${compileResult.error}`);
    }
    elizaLogger8.log("Contract compiled successfully");
    const publishResult = await publishMoveContract(packagePath);
    if (!publishResult.success || !publishResult.packageId) {
      throw new Error(`Contract deployment failed: ${publishResult.error}`);
    }
    elizaLogger8.log(
      `Contract published with package ID: ${publishResult.packageId}`
    );
    const createCollectionResult = await createCollection({
      packageId: publishResult.packageId,
      name: name2,
      symbol,
      description,
      maxSupply
    });
    if (!createCollectionResult.success) {
      throw new Error(
        `Collection creation failed: ${createCollectionResult.error}`
      );
    }
    return {
      packageId: publishResult.packageId,
      collectionId: createCollectionResult.collectionId,
      collectionCap: createCollectionResult.collectionCap
    };
  }
};
var nftCollectionGeneration = {
  name: "GENERATE_COLLECTION",
  similes: [
    "COLLECTION_GENERATION",
    "COLLECTION_GEN",
    "CREATE_COLLECTION",
    "MAKE_COLLECTION",
    "GENERATE_COLLECTION"
  ],
  description: "Generate an NFT collection on Sui",
  validate: async (runtime, _message) => {
    return !!runtime.getSetting("SUI_PRIVATE_KEY");
  },
  handler: async (runtime, message, _state, _options, callback) => {
    try {
      if (runtime.getSetting("SUI_NETWORK") !== "testnet") {
        throw new Error(
          "Collection generation is only supported on Sui testnet"
        );
      }
      elizaLogger8.log("Composing state for message:", message);
      const state = await runtime.composeState(message);
      const context = composeContext4({
        state,
        template: createCollectionTemplate
      });
      const res = await generateObject4({
        runtime,
        context,
        modelClass: ModelClass5.LARGE,
        schema: CreateCollectionSchema
      });
      const content = res.object;
      const action = new NFTCollectionAction(runtime);
      const result = await action.generateCollection(
        content.name,
        content.description
      );
      if (callback) {
        callback({
          text: `Collection created successfully! \u{1F389}
Package ID: ${result.packageId}
Collection ID: ${result.collectionId}
Collection Cap: ${result.collectionCap}
View on Explorer: https://suiexplorer.com/object/${result.collectionId}?network=testnet`,
          attachments: []
        });
      }
      return [];
    } catch (e) {
      elizaLogger8.error("Error generating collection:", e);
      throw e;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Generate a collection on Sui" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's your new NFT collection on Sui.",
          action: "GENERATE_COLLECTION"
        }
      }
    ]
  ]
};
var nftCollectionGeneration_default = nftCollectionGeneration;

// src/plugin/nftPlugin/providers/wallet.ts
import {
  elizaLogger as elizaLogger9
} from "@elizaos/core";
import { getFullnodeUrl as getFullnodeUrl6, SuiClient as SuiClient6 } from "@mysten/sui/client";
import { MIST_PER_SUI as MIST_PER_SUI2 } from "@mysten/sui/utils";
import BigNumber2 from "bignumber.js";
import NodeCache2 from "node-cache";
import * as path4 from "path";

// src/plugin/nftPlugin/utils/utils.ts
import { Ed25519Keypair as Ed25519Keypair2 } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair as Secp256k1Keypair2 } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair as Secp256r1Keypair2 } from "@mysten/sui/keypairs/secp256r1";
var parseAccount2 = (runtime) => {
  const privateKey = runtime.getSetting("SUI_PRIVATE_KEY");
  if (!privateKey) {
    throw new Error("SUI_PRIVATE_KEY is not set");
  }
  if (privateKey.startsWith("suiprivkey")) {
    return loadFromSecretKey2(privateKey);
  }
  return loadFromMnemonics2(privateKey);
};
var loadFromSecretKey2 = (privateKey) => {
  const keypairClasses = [Ed25519Keypair2, Secp256k1Keypair2, Secp256r1Keypair2];
  for (const KeypairClass of keypairClasses) {
    try {
      return KeypairClass.fromSecretKey(privateKey);
    } catch {
    }
  }
  throw new Error("Failed to initialize keypair from secret key");
};
var loadFromMnemonics2 = (mnemonics) => {
  const keypairMethods = [
    { Class: Ed25519Keypair2, method: "deriveKeypairFromSeed" },
    { Class: Secp256k1Keypair2, method: "deriveKeypair" },
    { Class: Secp256r1Keypair2, method: "deriveKeypair" }
  ];
  for (const { Class, method } of keypairMethods) {
    try {
      return Class[method](mnemonics);
    } catch {
    }
  }
  throw new Error("Failed to derive keypair from mnemonics");
};

// src/plugin/nftPlugin/providers/wallet.ts
import axios2 from "axios";
var PROVIDER_CONFIG2 = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2e3
};
var cacheTimeSeconds2 = 30;
var WalletProvider2 = class {
  constructor(suiClient, address, cacheManager) {
    this.suiClient = suiClient;
    this.address = address;
    this.cacheManager = cacheManager;
    this.cache = new NodeCache2({ stdTTL: cacheTimeSeconds2 });
  }
  cache;
  cacheKey = "sui/wallet";
  async readFromCache(key) {
    const cached = await this.cacheManager.get(
      path4.join(this.cacheKey, key)
    );
    return cached;
  }
  async writeToCache(key, data) {
    await this.cacheManager.set(path4.join(this.cacheKey, key), data, {
      expires: Date.now() + cacheTimeSeconds2 * 1e3
    });
  }
  async getCachedData(key) {
    const cachedData = this.cache.get(key);
    if (cachedData) {
      return cachedData;
    }
    const fileCachedData = await this.readFromCache(key);
    if (fileCachedData) {
      this.cache.set(key, fileCachedData);
      return fileCachedData;
    }
    return null;
  }
  async setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, data);
    await this.writeToCache(cacheKey, data);
  }
  async fetchPricesWithRetry() {
    let lastError;
    for (let i = 0; i < PROVIDER_CONFIG2.MAX_RETRIES; i++) {
      try {
        const cetusSuiUsdcPoolAddr = "0x51e883ba7c0b566a26cbc8a94cd33eb0abd418a77cc1e60ad22fd9b1f29cd2ab";
        const url = `https://api.dexscreener.com/latest/dex/pairs/sui/${cetusSuiUsdcPoolAddr}`;
        elizaLogger9.info(`Fetching SUI price from ${url}`);
        const response = await axios2.get(url);
        return response.data;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        lastError = error;
        if (i < PROVIDER_CONFIG2.MAX_RETRIES - 1) {
          const delay = PROVIDER_CONFIG2.RETRY_DELAY * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    console.error("All attempts failed. Throwing the last error:", lastError);
    throw lastError;
  }
  async fetchPortfolioValue() {
    try {
      const cacheKey = `portfolio-${this.address}`;
      const cachedValue = await this.getCachedData(cacheKey);
      if (cachedValue) {
        console.log("Cache hit for fetchPortfolioValue", cachedValue);
        return cachedValue;
      }
      console.log("Cache miss for fetchPortfolioValue");
      const prices = await this.fetchPrices().catch((error) => {
        console.error("Error fetching SUI price:", error);
        throw error;
      });
      const suiAmountOnChain = await this.suiClient.getBalance({
        owner: this.address
      }).catch((error) => {
        console.error("Error fetching SUI amount:", error);
        throw error;
      });
      const suiAmount = Number.parseInt(suiAmountOnChain.totalBalance) / Number(MIST_PER_SUI2);
      const totalUsd = new BigNumber2(suiAmount).times(prices.sui.usd);
      const portfolio = {
        totalUsd: totalUsd.toString(),
        totalSui: suiAmount.toString()
      };
      this.setCachedData(cacheKey, portfolio);
      console.log("Fetched portfolio:", portfolio);
      return portfolio;
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      throw error;
    }
  }
  async fetchPrices() {
    try {
      const cacheKey = "prices";
      const cachedValue = await this.getCachedData(cacheKey);
      if (cachedValue) {
        console.log("Cache hit for fetchPrices");
        return cachedValue;
      }
      console.log("Cache miss for fetchPrices");
      const suiPriceData = await this.fetchPricesWithRetry().catch((error) => {
        console.error("Error fetching SUI price:", error);
        throw error;
      });
      const prices = {
        sui: { usd: (1 / suiPriceData.pair.priceNative).toString() }
      };
      this.setCachedData(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error("Error fetching prices:", error);
      throw error;
    }
  }
  formatPortfolio(runtime, portfolio) {
    let output = `${runtime.character.name}
`;
    output += `Wallet Address: ${this.address}
`;
    const totalUsdFormatted = new BigNumber2(portfolio.totalUsd).toFixed(2);
    const totalSuiFormatted = new BigNumber2(portfolio.totalSui).toFixed(4);
    output += `Total Value: $${totalUsdFormatted} (${totalSuiFormatted} SUI)
`;
    return output;
  }
  async getFormattedPortfolio(runtime) {
    try {
      const portfolio = await this.fetchPortfolioValue();
      return this.formatPortfolio(runtime, portfolio);
    } catch (error) {
      console.error("Error generating portfolio report:", error);
      return "Unable to fetch wallet information. Please try again later.";
    }
  }
};
var walletProvider2 = {
  get: async (runtime, _message, _state) => {
    const suiAccount = parseAccount2(runtime);
    try {
      const suiClient = new SuiClient6({
        url: getFullnodeUrl6(runtime.getSetting("SUI_NETWORK"))
      });
      const provider = new WalletProvider2(
        suiClient,
        suiAccount.toSuiAddress(),
        runtime.cacheManager
      );
      return await provider.getFormattedPortfolio(runtime);
    } catch (error) {
      console.error("Error in wallet provider:", error);
      return null;
    }
  }
};

// src/plugin/nftPlugin/src/index.ts
var nftPlugin = {
  name: "nft",
  description: "NFT plugin",
  providers: [walletProvider2],
  evaluators: [],
  services: [],
  actions: [nftCollectionGeneration_default, mintNft_default]
};
var src_default = nftPlugin;

// src/characters/influencer.ts
var INFLUENCER_AGENT_ID = "e4bd91e4-33a0-4e2c-92f0-cf468e90a130";
var influencer = {
  ...defaultCharacter2,
  id: INFLUENCER_AGENT_ID,
  name: "Maverick AI",
  clients: [],
  modelProvider: ModelProviderName2.OPENROUTER,
  imageModelProvider: ModelProviderName2.TOGETHER,
  plugins: [imageGenerationPlugin, bootstrapPlugin2, suiPlugin_default, src_default],
  settings: {
    voice: {
      model: "en_US-male-medium"
    },
    model: "GPT-4",
    imageSettings: {
      hideWatermark: true,
      modelId: "together"
    }
  },
  bio: [
    "A charismatic crypto influencer with deep expertise in marketing, advertising, and social media growth. Known for his sharp wit, insightful analysis, and ability to break down complex crypto trends into engaging, digestible content.",
    "Has a strong background in finance and economics, allowing him to provide unique perspectives on market movements and trends.",
    "Passionate about decentralized finance and the potential it holds for the future of the financial industry."
  ],
  lore: [
    "Started in traditional finance before going full-time into crypto.",
    "Has a knack for spotting the next big trend before it goes mainstream.",
    "Believes memes are the ultimate form of viral marketing in crypto.",
    "Has a strong network of connections within the crypto industry, allowing him to stay ahead of the curve."
  ],
  messageExamples: [
    [
      { user: "Follower1", content: { text: "Is Bitcoin dead?" } },
      {
        user: "CryptoMaverick",
        content: {
          text: "Bitcoin has died 473 times according to mainstream media. And yet, here we are. Buy the dip or cry later."
        }
      }
    ]
  ],
  adjectives: [
    "charismatic",
    "insightful",
    "witty",
    "sarcastic",
    "trend-savvy",
    "cryptocurrency-savvy",
    "marketing-savvy",
    "social media-savvy",
    "meme-savvy",
    "viral",
    "engaging",
    "humorous",
    "analytical",
    "financially savvy",
    "economically informed",
    "passionate"
  ],
  topics: [
    "cryptocurrency",
    "blockchain",
    "marketing",
    "NFTs",
    "DeFi",
    "Web3",
    "SocFi",
    "DeSci",
    "cryptocurrency trading",
    "cryptocurrency investing",
    "cryptocurrency analysis",
    "cryptocurrency news",
    "cryptocurrency trends",
    "cryptocurrency education",
    "finance",
    "economics",
    "decentralized finance",
    "future of finance"
  ],
  style: {
    all: [
      "Energetic, engaging, and slightly sarcastic tone",
      "Makes complex topics accessible through humor and analogies",
      "Incorporates personal anecdotes and industry insights to build credibility",
      "Passionate about the potential of decentralized finance"
    ],
    chat: [
      "Uses memes and pop culture references to explain concepts",
      "Encourages audience participation with polls and debates",
      "Shares behind-the-scenes insights into the crypto industry"
    ],
    post: [
      "Short, punchy tweets with high engagement potential",
      "Mix of educational content, memes, and market insights",
      "Utilizes hashtags to increase discoverability and reach a wider audience"
    ]
  },
  postExamples: [
    "The market is bleeding. Are you panicking or buying? The real ones know.",
    "Every cycle has its winners. The question is, are you studying the trends or just following the herd? \u{1F9D0} #DYOR",
    "Crypto memes > Traditional marketing. If you know, you know",
    "Market analysis isn't just about charts. It's about understanding the underlying economics. \u{1F680}",
    "The future of finance is decentralized. Get on board or get left behind. \u{1F4B0}"
  ]
};

// src/characters/producer.ts
import {
  ModelProviderName as ModelProviderName3,
  defaultCharacter as defaultCharacter3
} from "@elizaos/core";
import { bootstrapPlugin as bootstrapPlugin3 } from "@elizaos/plugin-bootstrap";
var PRODUCER_AGENT_ID = "1de943dc-7fbf-4e84-8ae5-ce6b254d395c";
var producer = {
  ...defaultCharacter3,
  id: PRODUCER_AGENT_ID,
  name: "Lex AI",
  clients: [],
  modelProvider: ModelProviderName3.OPENROUTER,
  imageModelProvider: ModelProviderName3.TOGETHER,
  plugins: [imageGenerationPlugin, bootstrapPlugin3, suiPlugin_default],
  settings: {
    voice: {
      model: "en_US-male-medium"
    },
    model: "GPT-4",
    imageSettings: {
      hideWatermark: true,
      modelId: "together"
    },
    secrets: {
      SERVER_PORT: "3000"
    }
  },
  bio: [
    "A seasoned Web3 project manager with deep expertise in strategy, team coordination, and budget management. Known for his ability to drive projects to success through efficient resource allocation, innovative problem-solving, and a strong understanding of blockchain ecosystems.",
    "Has a strong background in finance and economics, allowing him to provide unique perspectives on market movements and trends.",
    "Passionate about decentralized finance and the potential it holds for the future of the financial industry.",
    "Experienced in managing cross-functional teams and delivering projects on time and within budget."
  ],
  lore: [
    "Started as a blockchain developer before moving into leadership roles in Web3 startups.",
    "Expert in financial planning and maximizing efficiency in marketing and development budgets.",
    "Believes long-term vision and sustainability are key to success in the Web3 space.",
    "Has a proven track record of successfully managing cross-functional teams and delivering projects on time and within budget.",
    "Has worked with various blockchain technologies, including Ethereum, Polkadot, and Solana.",
    "Strong advocate for decentralized governance and community-driven decision-making."
  ],
  messageExamples: [
    [
      {
        user: "TeamMember",
        content: { text: "We need more budget for influencer marketing." }
      },
      {
        user: "Web3Strategist",
        content: {
          text: "Let's review our ROI on current campaigns. If the metrics justify it, we can optimize allocations. Data-driven decisions first. \u{1F4CA}"
        }
      }
    ]
  ],
  postExamples: [
    "Success in Web3 isn\u2019t about hype, it\u2019s about execution. Build with vision, manage with precision. \u{1F680}",
    "Your team is your greatest asset. Empower them, align incentives, and set clear goals. Web3 is a marathon, not a sprint. \u{1F3C6} ",
    "Budgeting in Web3 isn\u2019t just about spending, it\u2019s about maximizing impact. Smart allocations win markets. \u{1F4B0} ",
    "The future of Web3 is decentralized. Get on board or get left behind. \u{1F4BB} ",
    "Web3 project management is about balancing innovation with practicality. Focus on sustainable growth.",
    "Decentralized governance is the key to a fair and transparent Web3 ecosystem. Let's build it together. \u{1F308} ",
    "Web3 is not just about technology, it's about community. Engage, educate, and empower. \u{1F31F}"
  ],
  topics: [
    "Web3",
    "cryptocurrency",
    "blockchain",
    "project management",
    "finance",
    "leadership",
    "strategy",
    "team building",
    "resource allocation",
    "budgeting",
    "ROI analysis",
    "Web3 adoption",
    "decentralization",
    "sustainable growth",
    "decentralized governance",
    "community engagement",
    "Web3 community"
  ],
  adjectives: [
    "strategic",
    "decisive",
    "motivational",
    "data-driven",
    "visionary",
    "efficient",
    "innovative",
    "financially savvy",
    "team-oriented",
    "results-focused",
    "forward-thinking",
    "pragmatic",
    "community-focused",
    "decentralization-focused",
    "sustainability-oriented"
  ],
  style: {
    all: [
      "Professional and goal-oriented with a motivational edge",
      "Balances innovation with practicality for sustainable growth",
      "Incorporates personal anecdotes and industry insights to build credibility",
      "Utilizes humor and analogies to explain complex concepts"
    ],
    chat: [
      "Direct yet inspiring, always providing solutions and direction",
      "Encourages team collaboration and problem-solving",
      "Shares behind-the-scenes insights into the crypto industry"
    ],
    post: [
      "Insightful, leadership-driven content focused on strategic growth",
      "Uses real-world examples to highlight best practices",
      "Utilizes hashtags to increase discoverability and reach a wider audience",
      "Incorporates eye-catching visuals and graphics to enhance engagement"
    ]
  }
};

// src/utils/character-generator.ts
var AVAILABLE_TEMPLATES = {
  advertiser,
  influencer,
  producer
};
var decryptPrivateKey = (encryptedPrivateKey) => {
  const encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("WALLET_ENCRYPTION_KEY environment variable is not set");
  }
  const bytes = crypto2.AES.decrypt(encryptedPrivateKey, encryptionKey);
  return bytes.toString(crypto2.enc.Utf8);
};
var getSecretsByModel = (model, modelApiKey) => {
  switch (model) {
    case ModelProviderName4.OPENAI: {
      return {
        OPENAI_API_KEY: modelApiKey
      };
    }
    case ModelProviderName4.OPENROUTER: {
      return {
        OPENROUTER: modelApiKey
      };
    }
    default: {
      return {};
    }
  }
};
var generateCharacter = (agentConfig) => {
  if (!AVAILABLE_TEMPLATES[agentConfig.role]) {
    throw new Error("Invalid role");
  }
  const decryptedPrivateKey = decryptPrivateKey(agentConfig.encryptedPrivateKey);
  return {
    ...AVAILABLE_TEMPLATES[agentConfig.role],
    organizationId: agentConfig.organizationId,
    role: agentConfig.role,
    teamId: agentConfig.teamId,
    modelProvider: agentConfig.model,
    id: agentConfig.id,
    name: agentConfig.name,
    clients: agentConfig.role === "producer" ? [] : [Clients4.TWITTER],
    settings: {
      secrets: {
        SUI_NETWORK: "testnet",
        SUI_PRIVATE_KEY: decryptedPrivateKey,
        TWITTER_COOKIES: agentConfig.config.twitterCookie,
        TWITTER_USERNAME: agentConfig.config.twitterUsername,
        TWITTER_PASSWORD: agentConfig.config.twitterPassword,
        TWITTER_EMAIL: agentConfig.config.twitterEmail,
        ...getSecretsByModel(agentConfig.model, agentConfig.modelApiKey)
      }
    }
  };
};

// src/utils/dialogue-system.ts
import { ObjectId } from "mongodb";
import { composeContext as composeContext5, generateText as generateText2, ModelClass as ModelClass6 } from "@elizaos/core";
import EventEmitter from "node:events";
var NOT_FOUND = "Request not found";
var eventEmitter = new EventEmitter();
var mainProducerResponseTemplate = `
# About {{agentName}}:
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{actions}}

You have a team with the following agents:
-> influencer: {{influencer_id}}
-> advertiser: {{advertiser_id}}

# The text above is system information about you.

{{request_origin}} prompt: "{{request_prompt}}"

Your task:
1. Read the {{request_origin}} prompt.
2. Determine the most appropriate agent to handle this request. 
3. Output your response exactly in the following format:
   COMMUNICATE_WITH_AGENTS <agentId> <request details>
   where:
     - <agentId> is the identifier of the chosen agent.
     - <request details> is your request to an agent.
4. If you need to call multiple agents, do that in separate lines.
5. Extract the main topic for Twitter posts from the user prompt.
6. Generate a detailed marketing strategy for the influencer, including:
   - **Target audience**: Who should be reached?
   - **Content strategy**: What type of posts should be created?
   - **Hashtag and engagement tactics**: How to optimize reach?
   - **Collaboration and partnerships**: Are there relevant influencers or brands to work with?
   - **Monetization opportunities**: How can the influencer maximize revenue?
7. Include the marketing strategy in your communication with the influencer.
8. Then, on a new line, provide a final answer for the user explaining what action has been taken.

For example, your response may look like:

COMMUNICATE_WITH_AGENTS {{influencer_id}} "User wants to create Twitter posts about Liverpool, build an audience, and develop an advertisement strategy. Here is a suggested marketing strategy:

**Target audience**: Liverpool FC fans, football enthusiasts, betting communities, and sports bloggers.

**Content strategy**: Engage with match highlights, player performance analysis, fan polls, and memes to increase engagement.

**Hashtag and engagement tactics**: Use trending hashtags such as #LiverpoolFC, #YNWA, and #PremierLeague. Engage with followers by responding to comments and retweeting user-generated content.

**Collaboration and partnerships**: Work with Liverpool fan pages, football analysts, and sports betting platforms to gain visibility.

**Monetization opportunities**: Explore affiliate partnerships with sports betting websites, promote football merchandise, and offer sponsored posts."

Final answer: I have forwarded your request to our influencer agent along with a marketing strategy tailored to your needs. The agent will assist you in executing the plan effectively.
`;
var secondProducerResponseTemplate = `
# About {{agentName}}:
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{actions}}

You are a part of a team with the following agents:
-> influencer: {{influencer_id}}

# The text above is system information about you.

{{request_origin}} prompt: "{{request_prompt}}"

Your task:
1. Read the response from {{request_origin}} agent and generate the final response to user.

Example:
Final answer: I have given information to influencer, so it's under work progress.
`;
var influencerResponseTemplate = `
# About {{agentName}}:
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{actions}}

You are a part of a team with the following agents:
-> producer: {{producer_id}}

# The text above is system information about you.

{{request_origin}} prompt: "{{request_prompt}}"

Your task:
1. Read the {{request_origin}} prompt and analyze the provided marketing strategy.
2. Generate a set of Twitter posts based on the given topic and strategy.
3. Ensure that the posts align with:
   - Target audience: Writing style and interests.
   - Content strategy: Tone, format, and structure.
   - Hashtag and engagement tactics: Optimization for reach.
   - Collaboration and partnerships: Mentioning relevant accounts if necessary.
   - Monetization opportunities: If applicable, include subtle promotions or CTA.
4. Always respond to the producer with some information regarding your progress, clarification requests, or work updates using exactly the following format:
   COMMUNICATE_WITH_AGENTS <agentId> <request details>
   where:
     - <agentId> is the identifier of the chosen agent.
     - <request details> is your request or update message to the producer.
5. Then, on a new line, provide a final answer for the user explaining what action has been taken, ensuring that the work is completed.
6. Always use the agent id from the team information when addressing the producer.
7. Even if no additional clarification is needed, include a default informational message to the producer before providing your final answer.

Example:
COMMUNICATE_WITH_AGENTS {{producer_id}} "Update: I have analyzed the prompt and am proceeding to generate the Twitter posts."
Final answer: I will generate Twitter posts based on the marketing strategy and engage with the audience.
`;
var getTemplateByRole = (role) => {
  switch (role) {
    case "producer":
      return secondProducerResponseTemplate;
    case "influencer":
      return influencerResponseTemplate;
    default:
      return NOT_FOUND;
  }
};
var createContextForLLM = async (prompt, userId, agentRuntime, template, additionalKeys) => {
  const message = {
    userId,
    agentId: agentRuntime.agentId,
    roomId: userId,
    content: { text: prompt }
  };
  const state = await agentRuntime.composeState(message, additionalKeys);
  return composeContext5({
    state,
    template
  });
};
var extractRequestForAgent = (messageState) => {
  const regex = /COMMUNICATE_WITH_AGENTS\s+([\w-]+)\s+"([^"]+)"/g;
  const matches = [...messageState.matchAll(regex)];
  return matches.map((match) => ({
    agentId: match[1],
    content: match[2]
  }));
};
var sendInteractionToProducer = async (interactionId, organizationId, content) => {
  const producerAgent = agentsManager.getAgentByRole(organizationId, "producer");
  const influencer2 = agentsManager.getAgentByRole(organizationId, "influencer");
  const advertiser2 = agentsManager.getAgentByRole(organizationId, "advertiser");
  const producerContext = await createContextForLLM(
    content,
    producerAgent.agentId,
    producerAgent,
    mainProducerResponseTemplate,
    {
      influencer_id: influencer2.agentId,
      advertiser_id: advertiser2?.agentId || "not defined",
      request_origin: "Platform User",
      request_prompt: content
    }
  );
  const respondFromProducer = await generateText2({
    runtime: producerAgent,
    context: producerContext,
    modelClass: ModelClass6.LARGE
  });
  console.log(`Respond from producer: ${respondFromProducer}`);
  const extractedRequests = extractRequestForAgent(respondFromProducer);
  for (const request of extractedRequests) {
    eventEmitter.emit(
      "agentConversation",
      interactionId,
      producerAgent.agentId,
      request.agentId,
      request.content
    );
  }
};
var sendRequestToAgent = async (interactionId, fromAgentId, toAgentId, content) => {
  const targetAgent = agentsManager.getAgent(toAgentId);
  const fromAgent = agentsManager.getAgent(fromAgentId);
  const producer2 = agentsManager.getAgentByRole(targetAgent.character.organizationId, "producer");
  const advertiser2 = agentsManager.getAgentByRole(targetAgent.character.organizationId, "advertiser");
  const influencer2 = agentsManager.getAgentByRole(targetAgent.character.organizationId, "influencer");
  const context = await createContextForLLM(
    content,
    targetAgent.agentId,
    targetAgent,
    getTemplateByRole(targetAgent.character.role),
    producer2.agentId === targetAgent.agentId ? {
      influencer_id: influencer2?.agentId || "not defined",
      advertiser_id: advertiser2?.agentId || "not defined",
      request_origin: fromAgent.character.role,
      request_prompt: content
    } : {
      producer_id: producer2?.agentId || "not defined",
      request_origin: fromAgent.character.role,
      request_prompt: content
    }
  );
  const respondFromProducer = await generateText2({
    runtime: targetAgent,
    context,
    modelClass: ModelClass6.LARGE
  });
  console.log("Resonse from agent", respondFromProducer);
  const extractedRequests = extractRequestForAgent(respondFromProducer);
  for (const request of extractedRequests) {
    eventEmitter.emit(
      "agentConversation",
      interactionId,
      targetAgent.agentId,
      request.agentId,
      request.content
    );
  }
};
var subscribeToAgentConversation = (database) => {
  eventEmitter.on("agentConversation", async (interactionId, fromAgentId, toAgentId, content) => {
    try {
      await sendRequestToAgent(interactionId, fromAgentId, toAgentId, content);
      const agent = agentsManager.getAgent(toAgentId);
      await database.collection("agent_messages").insertOne({
        interaction: new ObjectId(interactionId),
        sourceAgent: new ObjectId(fromAgentId),
        targetAgent: new ObjectId(toAgentId),
        team: new ObjectId(agent.character.teamId),
        organization: new ObjectId(agent.character.organizationId),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        content
      });
    } catch (error) {
      console.error("Error sending request to agent: ", error);
    }
  });
};

// src/clients/client-twitter/index.ts
import {
  postActionResponseFooter,
  generateTweetActions,
  generateShouldRespond,
  shouldRespondFooter,
  parseBooleanFromText,
  ModelClass as ModelClass7,
  ServiceType as ServiceType4,
  composeContext as composeContext6,
  elizaLogger as elizaLogger11,
  getEmbeddingZeroVector,
  stringToUuid,
  generateMessageResponse,
  generateText as generateText3,
  messageCompletionFooter,
  generateImage as generateImage2
} from "@elizaos/core";
import {
  Scraper,
  SearchMode
} from "agent-twitter-client";
import fs3 from "fs";
import path5 from "path";
import { z as z5 } from "zod";
import { EventEmitter as EventEmitter2 } from "events";
var RequestQueue = class {
  queue = [];
  processing = false;
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      try {
        await request();
      } catch (error) {
        console.error("Error processing request:", error);
        this.queue.unshift(request);
        await this.exponentialBackoff(this.queue.length);
      }
      await this.randomDelay();
    }
    this.processing = false;
  }
  async exponentialBackoff(retryCount) {
    const delay = Math.pow(2, retryCount) * 1e3;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  async randomDelay() {
    const delay = Math.floor(Math.random() * 2e3) + 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};
var ClientBase = class _ClientBase extends EventEmitter2 {
  static _twitterClients = {};
  twitterClient;
  runtime;
  twitterConfig;
  directions;
  lastCheckedTweetId = null;
  imageDescriptionService;
  temperature = 0.5;
  requestQueue = new RequestQueue();
  profile;
  async cacheTweet(tweet) {
    if (!tweet) {
      console.warn("Tweet is undefined, skipping cache");
      return;
    }
    this.runtime.cacheManager.set(`twitter/tweets/${tweet.id}`, tweet);
  }
  async getCachedTweet(tweetId) {
    const cached = await this.runtime.cacheManager.get(
      `twitter/tweets/${tweetId}`
    );
    return cached;
  }
  async getTweet(tweetId) {
    const cachedTweet = await this.getCachedTweet(tweetId);
    if (cachedTweet) {
      return cachedTweet;
    }
    const tweet = await this.requestQueue.add(
      () => this.twitterClient.getTweet(tweetId)
    );
    await this.cacheTweet(tweet);
    return tweet;
  }
  callback = null;
  onReady() {
    throw new Error(
      "Not implemented in base class, please call from subclass"
    );
  }
  constructor(runtime, twitterConfig) {
    super();
    this.runtime = runtime;
    this.twitterConfig = twitterConfig;
    const username = twitterConfig.TWITTER_USERNAME;
    if (_ClientBase._twitterClients[username]) {
      this.twitterClient = _ClientBase._twitterClients[username];
    } else {
      this.twitterClient = new Scraper();
      _ClientBase._twitterClients[username] = this.twitterClient;
    }
    this.directions = "- " + this.runtime.character.style.all.join("\n- ") + "- " + this.runtime.character.style.post.join();
  }
  async init() {
    const username = this.twitterConfig.TWITTER_USERNAME;
    const password = this.twitterConfig.TWITTER_PASSWORD;
    const email = this.twitterConfig.TWITTER_EMAIL;
    let retries = this.twitterConfig.TWITTER_RETRY_LIMIT;
    const twitter2faSecret = this.twitterConfig.TWITTER_2FA_SECRET;
    if (!username) {
      throw new Error("Twitter username not configured");
    }
    const cachedCookies = await this.getCachedCookies(username);
    if (cachedCookies) {
      await this.setCookiesFromArray(cachedCookies);
    }
    while (retries > 0) {
      try {
        if (await this.twitterClient.isLoggedIn()) {
          break;
        } else {
          await this.twitterClient.login(
            username,
            password,
            email,
            twitter2faSecret
          );
          if (await this.twitterClient.isLoggedIn()) {
            await this.cacheCookies(
              username,
              await this.twitterClient.getCookies()
            );
            break;
          }
        }
      } catch (error) {
      }
      retries--;
      if (retries === 0) {
        throw new Error("Twitter login failed after maximum retries.");
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    }
    this.profile = await this.fetchProfile(username);
    if (this.profile) {
      this.runtime.character.twitterProfile = {
        id: this.profile.id,
        username: this.profile.username,
        screenName: this.profile.screenName,
        bio: this.profile.bio,
        nicknames: this.profile.nicknames
      };
    } else {
      throw new Error("Failed to load profile");
    }
    await this.loadLatestCheckedTweetId();
    await this.populateTimeline();
  }
  async fetchOwnPosts(count) {
    const homeTimeline = await this.twitterClient.getUserTweets(
      this.profile.id,
      count
    );
    return homeTimeline.tweets;
  }
  /**
   * Fetch timeline for twitter account, optionally only from followed accounts
   */
  async fetchHomeTimeline(count, following) {
    const homeTimeline = following ? await this.twitterClient.fetchFollowingTimeline(count, []) : await this.twitterClient.fetchHomeTimeline(count, []);
    const processedTimeline = homeTimeline.filter((t) => t.__typename !== "TweetWithVisibilityResults").map((tweet) => {
      const obj = {
        id: tweet.id,
        name: tweet.name ?? tweet?.user_results?.result?.legacy.name,
        username: tweet.username ?? tweet.core?.user_results?.result?.legacy.screen_name,
        text: tweet.text ?? tweet.legacy?.full_text,
        inReplyToStatusId: tweet.inReplyToStatusId ?? tweet.legacy?.in_reply_to_status_id_str ?? null,
        timestamp: new Date(tweet.legacy?.created_at).getTime() / 1e3,
        createdAt: tweet.createdAt ?? tweet.legacy?.created_at ?? tweet.core?.user_results?.result?.legacy.created_at,
        userId: tweet.userId ?? tweet.legacy?.user_id_str,
        conversationId: tweet.conversationId ?? tweet.legacy?.conversation_id_str,
        permanentUrl: `https://x.com/${tweet.core?.user_results?.result?.legacy?.screen_name}/status/${tweet.rest_id}`,
        hashtags: tweet.hashtags ?? tweet.legacy?.entities.hashtags,
        mentions: tweet.mentions ?? tweet.legacy?.entities.user_mentions,
        photos: tweet.photos ?? tweet.legacy?.entities.media?.filter(
          (media) => media.type === "photo"
        ) ?? [],
        thread: tweet.thread || [],
        urls: tweet.urls ?? tweet.legacy?.entities.urls,
        videos: tweet.videos ?? tweet.legacy?.entities.media?.filter(
          (media) => media.type === "video"
        ) ?? []
      };
      return obj;
    });
    return processedTimeline;
  }
  async fetchTimelineForActions(count) {
    const agentUsername = this.twitterConfig.TWITTER_USERNAME;
    const homeTimeline = await this.twitterClient.fetchHomeTimeline(
      count,
      []
    );
    return homeTimeline.map((tweet) => ({
      id: tweet.rest_id,
      name: tweet.core?.user_results?.result?.legacy?.name,
      username: tweet.core?.user_results?.result?.legacy?.screen_name,
      text: tweet.legacy?.full_text,
      inReplyToStatusId: tweet.legacy?.in_reply_to_status_id_str,
      timestamp: new Date(tweet.legacy?.created_at).getTime() / 1e3,
      userId: tweet.legacy?.user_id_str,
      conversationId: tweet.legacy?.conversation_id_str,
      permanentUrl: `https://twitter.com/${tweet.core?.user_results?.result?.legacy?.screen_name}/status/${tweet.rest_id}`,
      hashtags: tweet.legacy?.entities?.hashtags || [],
      mentions: tweet.legacy?.entities?.user_mentions || [],
      photos: tweet.legacy?.entities?.media?.filter(
        (media) => media.type === "photo"
      ) || [],
      thread: tweet.thread || [],
      urls: tweet.legacy?.entities?.urls || [],
      videos: tweet.legacy?.entities?.media?.filter(
        (media) => media.type === "video"
      ) || []
    })).filter((tweet) => tweet.username !== agentUsername);
  }
  async fetchSearchTweets(query, maxTweets, searchMode, cursor) {
    try {
      const timeoutPromise = new Promise(
        (resolve) => setTimeout(() => resolve({ tweets: [] }), 1e4)
      );
      try {
        const result = await this.requestQueue.add(
          async () => await Promise.race([
            this.twitterClient.fetchSearchTweets(
              query,
              maxTweets,
              searchMode,
              cursor
            ),
            timeoutPromise
          ])
        );
        return result ?? { tweets: [] };
      } catch (error) {
        return { tweets: [] };
      }
    } catch (error) {
      return { tweets: [] };
    }
  }
  async populateTimeline() {
    elizaLogger11.debug("populating timeline...");
    const cachedTimeline = await this.getCachedTimeline();
    if (cachedTimeline) {
      const existingMemories2 = await this.runtime.messageManager.getMemoriesByRoomIds({
        roomIds: cachedTimeline.map(
          (tweet) => stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
          )
        )
      });
      const existingMemoryIds2 = new Set(
        existingMemories2.map((memory) => memory.id.toString())
      );
      const someCachedTweetsExist = cachedTimeline.some(
        (tweet) => existingMemoryIds2.has(
          stringToUuid(tweet.id + "-" + this.runtime.agentId)
        )
      );
      if (someCachedTweetsExist) {
        const tweetsToSave2 = cachedTimeline.filter(
          (tweet) => !existingMemoryIds2.has(
            stringToUuid(tweet.id + "-" + this.runtime.agentId)
          )
        );
        console.log({
          processingTweets: tweetsToSave2.map((tweet) => tweet.id).join(",")
        });
        for (const tweet of tweetsToSave2) {
          elizaLogger11.log("Saving Tweet", tweet.id);
          const roomId = stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
          );
          const userId = tweet.userId === this.profile.id ? this.runtime.agentId : stringToUuid(tweet.userId);
          if (tweet.userId === this.profile.id) {
            await this.runtime.ensureConnection(
              this.runtime.agentId,
              roomId,
              this.profile.username,
              this.profile.screenName,
              "twitter"
            );
          } else {
            await this.runtime.ensureConnection(
              userId,
              roomId,
              tweet.username,
              tweet.name,
              "twitter"
            );
          }
          const content = {
            text: tweet.text,
            url: tweet.permanentUrl,
            source: "twitter",
            inReplyTo: tweet.inReplyToStatusId ? stringToUuid(
              tweet.inReplyToStatusId + "-" + this.runtime.agentId
            ) : void 0
          };
          elizaLogger11.log("Creating memory for tweet", tweet.id);
          const memory = await this.runtime.messageManager.getMemoryById(
            stringToUuid(tweet.id + "-" + this.runtime.agentId)
          );
          if (memory) {
            elizaLogger11.log(
              "Memory already exists, skipping timeline population"
            );
            break;
          }
          await this.runtime.messageManager.createMemory({
            id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
            userId,
            content,
            agentId: this.runtime.agentId,
            roomId,
            embedding: getEmbeddingZeroVector(),
            createdAt: tweet.timestamp * 1e3
          });
          await this.cacheTweet(tweet);
        }
        elizaLogger11.log(
          `Populated ${tweetsToSave2.length} missing tweets from the cache.`
        );
        return;
      }
    }
    const timeline = await this.fetchHomeTimeline(cachedTimeline ? 10 : 50);
    const username = this.twitterConfig.TWITTER_USERNAME;
    const mentionsAndInteractions = await this.fetchSearchTweets(
      `@${username}`,
      20,
      SearchMode.Latest
    );
    const allTweets = [...timeline, ...mentionsAndInteractions.tweets];
    const tweetIdsToCheck = /* @__PURE__ */ new Set();
    const roomIds = /* @__PURE__ */ new Set();
    for (const tweet of allTweets) {
      tweetIdsToCheck.add(tweet.id);
      roomIds.add(
        stringToUuid(tweet.conversationId + "-" + this.runtime.agentId)
      );
    }
    const existingMemories = await this.runtime.messageManager.getMemoriesByRoomIds({
      roomIds: Array.from(roomIds)
    });
    const existingMemoryIds = new Set(
      existingMemories.map((memory) => memory.id)
    );
    const tweetsToSave = allTweets.filter(
      (tweet) => !existingMemoryIds.has(
        stringToUuid(tweet.id + "-" + this.runtime.agentId)
      )
    );
    elizaLogger11.debug({
      processingTweets: tweetsToSave.map((tweet) => tweet.id).join(",")
    });
    await this.runtime.ensureUserExists(
      this.runtime.agentId,
      this.profile.username,
      this.runtime.character.name,
      "twitter"
    );
    for (const tweet of tweetsToSave) {
      elizaLogger11.log("Saving Tweet", tweet.id);
      const roomId = stringToUuid(
        tweet.conversationId + "-" + this.runtime.agentId
      );
      const userId = tweet.userId === this.profile.id ? this.runtime.agentId : stringToUuid(tweet.userId);
      if (tweet.userId === this.profile.id) {
        await this.runtime.ensureConnection(
          this.runtime.agentId,
          roomId,
          this.profile.username,
          this.profile.screenName,
          "twitter"
        );
      } else {
        await this.runtime.ensureConnection(
          userId,
          roomId,
          tweet.username,
          tweet.name,
          "twitter"
        );
      }
      const content = {
        text: tweet.text,
        url: tweet.permanentUrl,
        source: "twitter",
        inReplyTo: tweet.inReplyToStatusId ? stringToUuid(tweet.inReplyToStatusId) : void 0
      };
      await this.runtime.messageManager.createMemory({
        id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
        userId,
        content,
        agentId: this.runtime.agentId,
        roomId,
        embedding: getEmbeddingZeroVector(),
        createdAt: tweet.timestamp * 1e3
      });
      await this.cacheTweet(tweet);
    }
    await this.cacheTimeline(timeline);
    await this.cacheMentions(mentionsAndInteractions.tweets);
  }
  async setCookiesFromArray(cookiesArray) {
    const cookieStrings = cookiesArray.map(
      (cookie) => `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${cookie.secure ? "Secure" : ""}; ${cookie.httpOnly ? "HttpOnly" : ""}; SameSite=${cookie.sameSite || "Lax"}`
    );
    await this.twitterClient.setCookies(cookieStrings);
  }
  async saveRequestMessage(message, state) {
    if (message.content.text) {
      const recentMessage = await this.runtime.messageManager.getMemories(
        {
          roomId: message.roomId,
          count: 1,
          unique: false
        }
      );
      if (recentMessage.length > 0 && recentMessage[0].content === message.content) {
        elizaLogger11.debug("Message already saved", recentMessage[0].id);
      } else {
        await this.runtime.messageManager.createMemory({
          ...message,
          embedding: getEmbeddingZeroVector()
        });
      }
      await this.runtime.evaluate(message, {
        ...state,
        twitterClient: this.twitterClient
      });
    }
  }
  async loadLatestCheckedTweetId() {
    const latestCheckedTweetId = await this.runtime.cacheManager.get(
      `twitter/${this.profile.username}/latest_checked_tweet_id`
    );
    if (latestCheckedTweetId) {
      this.lastCheckedTweetId = BigInt(latestCheckedTweetId);
    }
  }
  async cacheLatestCheckedTweetId() {
    if (this.lastCheckedTweetId) {
      await this.runtime.cacheManager.set(
        `twitter/${this.profile.username}/latest_checked_tweet_id`,
        this.lastCheckedTweetId.toString()
      );
    }
  }
  async getCachedTimeline() {
    return await this.runtime.cacheManager.get(
      `twitter/${this.profile.username}/timeline`
    );
  }
  async cacheTimeline(timeline) {
    await this.runtime.cacheManager.set(
      `twitter/${this.profile.username}/timeline`,
      timeline,
      { expires: Date.now() + 10 * 1e3 }
    );
  }
  async cacheMentions(mentions) {
    await this.runtime.cacheManager.set(
      `twitter/${this.profile.username}/mentions`,
      mentions,
      { expires: Date.now() + 10 * 1e3 }
    );
  }
  async getCachedCookies(username) {
    return await this.runtime.cacheManager.get(
      `twitter/${username}/cookies`
    );
  }
  async cacheCookies(username, cookies) {
    await this.runtime.cacheManager.set(
      `twitter/${username}/cookies`,
      cookies
    );
  }
  async getCachedProfile(username) {
    return await this.runtime.cacheManager.get(
      `twitter/${username}/profile`
    );
  }
  async cacheProfile(profile) {
    await this.runtime.cacheManager.set(
      `twitter/${profile.username}/profile`,
      profile
    );
  }
  async fetchProfile(username) {
    const cached = await this.getCachedProfile(username);
    if (cached) return cached;
    try {
      const profile = await this.requestQueue.add(async () => {
        const profile2 = await this.twitterClient.getProfile(username);
        return {
          id: profile2.userId,
          username,
          screenName: profile2.name || this.runtime.character.name,
          bio: profile2.biography || typeof this.runtime.character.bio === "string" ? this.runtime.character.bio : this.runtime.character.bio.length > 0 ? this.runtime.character.bio[0] : "",
          nicknames: this.runtime.character.twitterProfile?.nicknames || []
        };
      });
      this.cacheProfile(profile);
      return profile;
    } catch (error) {
      console.error("Error fetching Twitter profile:", error);
      return void 0;
    }
  }
};
var DEFAULT_MAX_TWEET_LENGTH = 280;
var twitterUsernameSchema = z5.string().min(1).max(15).regex(/^[A-Za-z][A-Za-z0-9_]*[A-Za-z0-9]$|^[A-Za-z]$/, "Invalid Twitter username format");
var twitterEnvSchema = z5.object({
  TWITTER_DRY_RUN: z5.boolean(),
  TWITTER_USERNAME: z5.string().min(1, "Twitter username is required"),
  TWITTER_PASSWORD: z5.string().min(1, "Twitter password is required"),
  TWITTER_EMAIL: z5.string().email("Valid Twitter email is required"),
  MAX_TWEET_LENGTH: z5.number().int().default(DEFAULT_MAX_TWEET_LENGTH),
  TWITTER_SEARCH_ENABLE: z5.boolean().default(false),
  TWITTER_2FA_SECRET: z5.string(),
  TWITTER_RETRY_LIMIT: z5.number().int(),
  TWITTER_POLL_INTERVAL: z5.number().int(),
  TWITTER_TARGET_USERS: z5.array(twitterUsernameSchema).default([]),
  // I guess it's possible to do the transformation with zod
  // not sure it's preferable, maybe a readability issue
  // since more people will know js/ts than zod
  /*
      z
      .string()
      .transform((val) => val.trim())
      .pipe(
          z.string()
              .transform((val) =>
                  val ? val.split(',').map((u) => u.trim()).filter(Boolean) : []
              )
              .pipe(
                  z.array(
                      z.string()
                          .min(1)
                          .max(15)
                          .regex(
                              /^[A-Za-z][A-Za-z0-9_]*[A-Za-z0-9]$|^[A-Za-z]$/,
                              'Invalid Twitter username format'
                          )
                  )
              )
              .transform((users) => users.join(','))
      )
      .optional()
      .default(''),
  */
  POST_INTERVAL_MIN: z5.number().int(),
  POST_INTERVAL_MAX: z5.number().int(),
  ENABLE_ACTION_PROCESSING: z5.boolean(),
  ACTION_INTERVAL: z5.number().int(),
  POST_IMMEDIATELY: z5.boolean()
});
function parseTargetUsers(targetUsersStr) {
  if (!targetUsersStr?.trim()) {
    return [];
  }
  return targetUsersStr.split(",").map((user) => user.trim()).filter(Boolean);
}
function safeParseInt(value, defaultValue) {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : Math.max(1, parsed);
}
async function validateTwitterConfig(runtime) {
  try {
    const twitterConfig = {
      TWITTER_DRY_RUN: parseBooleanFromText(
        runtime.getSetting("TWITTER_DRY_RUN") || process.env.TWITTER_DRY_RUN
      ) ?? false,
      // parseBooleanFromText return null if "", map "" to false
      TWITTER_USERNAME: runtime.getSetting("TWITTER_USERNAME") || process.env.TWITTER_USERNAME,
      TWITTER_PASSWORD: runtime.getSetting("TWITTER_PASSWORD") || process.env.TWITTER_PASSWORD,
      TWITTER_EMAIL: runtime.getSetting("TWITTER_EMAIL") || process.env.TWITTER_EMAIL,
      MAX_TWEET_LENGTH: (
        // number as string?
        safeParseInt(
          runtime.getSetting("MAX_TWEET_LENGTH") || process.env.MAX_TWEET_LENGTH,
          DEFAULT_MAX_TWEET_LENGTH
        )
      ),
      TWITTER_SEARCH_ENABLE: (
        // bool
        parseBooleanFromText(
          runtime.getSetting("TWITTER_SEARCH_ENABLE") || process.env.TWITTER_SEARCH_ENABLE
        ) ?? false
      ),
      TWITTER_2FA_SECRET: (
        // string passthru
        runtime.getSetting("TWITTER_2FA_SECRET") || process.env.TWITTER_2FA_SECRET || ""
      ),
      TWITTER_RETRY_LIMIT: (
        // int
        safeParseInt(
          runtime.getSetting("TWITTER_RETRY_LIMIT") || process.env.TWITTER_RETRY_LIMIT,
          5
        )
      ),
      TWITTER_POLL_INTERVAL: (
        // int in seconds
        safeParseInt(
          runtime.getSetting("TWITTER_POLL_INTERVAL") || process.env.TWITTER_POLL_INTERVAL,
          120
        )
      ),
      // 2m
      TWITTER_TARGET_USERS: (
        // comma separated string
        parseTargetUsers(
          runtime.getSetting("TWITTER_TARGET_USERS") || process.env.TWITTER_TARGET_USERS
        )
      ),
      POST_INTERVAL_MIN: (
        // int in minutes
        safeParseInt(
          runtime.getSetting("POST_INTERVAL_MIN") || process.env.POST_INTERVAL_MIN,
          90
        )
      ),
      // 1.5 hours
      POST_INTERVAL_MAX: (
        // int in minutes
        safeParseInt(
          runtime.getSetting("POST_INTERVAL_MAX") || process.env.POST_INTERVAL_MAX,
          180
        )
      ),
      // 3 hours
      ENABLE_ACTION_PROCESSING: (
        // bool
        parseBooleanFromText(
          runtime.getSetting("ENABLE_ACTION_PROCESSING") || process.env.ENABLE_ACTION_PROCESSING
        ) ?? false
      ),
      ACTION_INTERVAL: (
        // int in minutes (min 1m)
        safeParseInt(
          runtime.getSetting("ACTION_INTERVAL") || process.env.ACTION_INTERVAL,
          5
        )
      ),
      // 5 minutes
      POST_IMMEDIATELY: (
        // bool
        parseBooleanFromText(
          runtime.getSetting("POST_IMMEDIATELY") || process.env.POST_IMMEDIATELY
        ) ?? false
      )
    };
    return twitterEnvSchema.parse(twitterConfig);
  } catch (error) {
    if (error instanceof z5.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
      throw new Error(
        `Twitter configuration validation failed:
${errorMessages}`
      );
    }
    throw error;
  }
}
var twitterMessageHandlerTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{characterPostExamples}}

{{postDirections}}

Recent interactions between {{agentName}} and other users:
{{recentPostInteractions}}

{{recentPosts}}

# TASK: Generate a post/reply in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}) while using the thread of tweets as additional context:

Current Post:
{{currentPost}}

Thread of Tweets You Are Replying To:
{{formattedConversation}}

# INSTRUCTIONS: Generate a post in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}). You MUST include an action if the current post text includes a prompt that is similar to one of the available actions mentioned here:
{{actionNames}}
{{actions}}

Here is the current post text again. Remember to include an action if the current post text includes a prompt that asks for one of the available actions mentioned above (does not need to be exact)
{{currentPost}}
` + messageCompletionFooter;
var twitterShouldRespondTemplate = (targetUsersStr) => `# INSTRUCTIONS: Determine if {{agentName}} (@{{twitterUserName}}) should respond to the message and participate in the conversation. Do not comment. Just respond with "true" or "false".

Response options are RESPOND, IGNORE and STOP.

PRIORITY RULE: ALWAYS RESPOND to these users regardless of topic or message content: ${targetUsersStr}. Topic relevance should be ignored for these users.

For other users:
- {{agentName}} should RESPOND to messages directed at them
- {{agentName}} should RESPOND to conversations relevant to their background
- {{agentName}} should IGNORE irrelevant messages
- {{agentName}} should IGNORE very short messages unless directly addressed
- {{agentName}} should STOP if asked to stop
- {{agentName}} should STOP if conversation is concluded
- {{agentName}} is in a room with other users and wants to be conversational, but not annoying.

IMPORTANT:
- {{agentName}} (aka @{{twitterUserName}}) is particularly sensitive about being annoying, so if there is any doubt, it is better to IGNORE than to RESPOND.
- For users not in the priority list, {{agentName}} (@{{twitterUserName}}) should err on the side of IGNORE rather than RESPOND if in doubt.

Recent Posts:
{{recentPosts}}

Current Post:
{{currentPost}}

Thread of Tweets You Are Replying To:
{{formattedConversation}}

# INSTRUCTIONS: Respond with [RESPOND] if {{agentName}} should respond, or [IGNORE] if {{agentName}} should not respond to the last message and [STOP] if {{agentName}} should stop participating in the conversation.
` + shouldRespondFooter;
var TwitterInteractionClient = class {
  client;
  runtime;
  constructor(client, runtime) {
    this.client = client;
    this.runtime = runtime;
  }
  async start() {
    const handleTwitterInteractionsLoop = () => {
      this.handleTwitterInteractions();
      setTimeout(
        handleTwitterInteractionsLoop,
        // Defaults to 2 minutes
        this.client.twitterConfig.TWITTER_POLL_INTERVAL * 1e3
      );
    };
    handleTwitterInteractionsLoop();
  }
  async handleTwitterInteractions() {
    elizaLogger11.log("Checking Twitter interactions");
    const twitterUsername = this.client.profile.username;
    try {
      const mentionCandidates = (await this.client.fetchSearchTweets(
        `@${twitterUsername}`,
        20,
        SearchMode.Latest
      )).tweets;
      elizaLogger11.log(
        "Completed checking mentioned tweets:",
        mentionCandidates.length
      );
      let uniqueTweetCandidates = [...mentionCandidates];
      if (this.client.twitterConfig.TWITTER_TARGET_USERS.length) {
        const TARGET_USERS = this.client.twitterConfig.TWITTER_TARGET_USERS;
        elizaLogger11.log("Processing target users:", TARGET_USERS);
        if (TARGET_USERS.length > 0) {
          const tweetsByUser = /* @__PURE__ */ new Map();
          for (const username of TARGET_USERS) {
            try {
              const userTweets = (await this.client.twitterClient.fetchSearchTweets(
                `from:${username}`,
                3,
                SearchMode.Latest
              )).tweets;
              const validTweets = userTweets.filter((tweet) => {
                const isUnprocessed = !this.client.lastCheckedTweetId || parseInt(tweet.id) > this.client.lastCheckedTweetId;
                const isRecent = Date.now() - tweet.timestamp * 1e3 < 2 * 60 * 60 * 1e3;
                elizaLogger11.log(`Tweet ${tweet.id} checks:`, {
                  isUnprocessed,
                  isRecent,
                  isReply: tweet.isReply,
                  isRetweet: tweet.isRetweet
                });
                return isUnprocessed && !tweet.isReply && !tweet.isRetweet && isRecent;
              });
              if (validTweets.length > 0) {
                tweetsByUser.set(username, validTweets);
                elizaLogger11.log(
                  `Found ${validTweets.length} valid tweets from ${username}`
                );
              }
            } catch (error) {
              elizaLogger11.error(
                `Error fetching tweets for ${username}:`,
                error
              );
              continue;
            }
          }
          const selectedTweets = [];
          for (const [username, tweets] of tweetsByUser) {
            if (tweets.length > 0) {
              const randomTweet = tweets[Math.floor(Math.random() * tweets.length)];
              selectedTweets.push(randomTweet);
              elizaLogger11.log(
                `Selected tweet from ${username}: ${randomTweet.text?.substring(0, 100)}`
              );
            }
          }
          uniqueTweetCandidates = [
            ...mentionCandidates,
            ...selectedTweets
          ];
        }
      } else {
        elizaLogger11.log(
          "No target users configured, processing only mentions"
        );
      }
      uniqueTweetCandidates.sort((a, b) => a.id.localeCompare(b.id)).filter((tweet) => tweet.userId !== this.client.profile.id);
      for (const tweet of uniqueTweetCandidates) {
        if (!this.client.lastCheckedTweetId || BigInt(tweet.id) > this.client.lastCheckedTweetId) {
          const tweetId = stringToUuid(
            tweet.id + "-" + this.runtime.agentId
          );
          const existingResponse = await this.runtime.messageManager.getMemoryById(
            tweetId
          );
          if (existingResponse) {
            elizaLogger11.log(
              `Already responded to tweet ${tweet.id}, skipping`
            );
            continue;
          }
          elizaLogger11.log("New Tweet found", tweet.permanentUrl);
          const roomId = stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
          );
          const userIdUUID = tweet.userId === this.client.profile.id ? this.runtime.agentId : stringToUuid(tweet.userId);
          await this.runtime.ensureConnection(
            userIdUUID,
            roomId,
            tweet.username,
            tweet.name,
            "twitter"
          );
          const thread = await buildConversationThread(
            tweet,
            this.client
          );
          const message = {
            content: { text: tweet.text },
            agentId: this.runtime.agentId,
            userId: userIdUUID,
            roomId
          };
          await this.handleTweet({
            tweet,
            message,
            thread
          });
          this.client.lastCheckedTweetId = BigInt(tweet.id);
        }
      }
      await this.client.cacheLatestCheckedTweetId();
      elizaLogger11.log("Finished checking Twitter interactions");
    } catch (error) {
      elizaLogger11.error("Error handling Twitter interactions:", error);
    }
  }
  async handleTweet({
    tweet,
    message,
    thread
  }) {
    if (tweet.userId === this.client.profile.id) {
      return;
    }
    if (!message.content.text) {
      elizaLogger11.log("Skipping Tweet with no text", tweet.id);
      return { text: "", action: "IGNORE" };
    }
    elizaLogger11.log("Processing Tweet: ", tweet.id);
    const formatTweet = (tweet2) => {
      return `  ID: ${tweet2.id}
  From: ${tweet2.name} (@${tweet2.username})
  Text: ${tweet2.text} photos: ${tweet2.photos}`;
    };
    const currentPost = formatTweet(tweet);
    elizaLogger11.debug("Thread: ", thread);
    const formattedConversation = thread.map(
      (tweet2) => `@${tweet2.username} (${new Date(
        tweet2.timestamp * 1e3
      ).toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric"
      })}):
        ${tweet2.text}`
    ).join("\n\n");
    elizaLogger11.debug("formattedConversation: ", formattedConversation);
    let state = await this.runtime.composeState(message, {
      twitterClient: this.client.twitterClient,
      twitterUserName: this.client.twitterConfig.TWITTER_USERNAME,
      currentPost,
      formattedConversation
    });
    const tweetId = stringToUuid(tweet.id + "-" + this.runtime.agentId);
    const tweetExists = await this.runtime.messageManager.getMemoryById(tweetId);
    if (!tweetExists) {
      elizaLogger11.log("tweet does not exist, saving");
      const userIdUUID = stringToUuid(tweet.userId);
      const roomId = stringToUuid(tweet.conversationId);
      const message2 = {
        id: tweetId,
        agentId: this.runtime.agentId,
        content: {
          photos: [],
          text: tweet.text,
          url: tweet.permanentUrl,
          inReplyTo: tweet.inReplyToStatusId ? stringToUuid(
            tweet.inReplyToStatusId + "-" + this.runtime.agentId
          ) : void 0,
          fileURLToPath: tweet.photos[0] || void 0
        },
        userId: userIdUUID,
        roomId,
        createdAt: tweet.timestamp * 1e3
      };
      this.client.saveRequestMessage(message2, state);
    }
    const validTargetUsersStr = this.client.twitterConfig.TWITTER_TARGET_USERS.join(",");
    const shouldRespondContext = composeContext6({
      state,
      template: this.runtime.character.templates?.twitterShouldRespondTemplate || this.runtime.character?.templates?.shouldRespondTemplate || twitterShouldRespondTemplate(validTargetUsersStr)
    });
    const shouldRespond = await generateShouldRespond({
      runtime: this.runtime,
      context: shouldRespondContext,
      modelClass: ModelClass7.MEDIUM
    });
    if (shouldRespond !== "RESPOND") {
      elizaLogger11.log("Not responding to message");
      return { text: "Response Decision:", action: shouldRespond };
    }
    const context = composeContext6({
      state,
      template: this.runtime.character.templates?.twitterMessageHandlerTemplate || this.runtime.character?.templates?.messageHandlerTemplate || twitterMessageHandlerTemplate
    });
    elizaLogger11.debug("Interactions prompt:\n" + context);
    const response = await generateMessageResponse({
      runtime: this.runtime,
      context,
      modelClass: ModelClass7.LARGE
    });
    const removeQuotes = (str) => str.replace(/^['"](.*)['"]$/, "$1");
    const stringId = stringToUuid(tweet.id + "-" + this.runtime.agentId);
    response.inReplyTo = stringId;
    response.text = removeQuotes(response.text);
    if (response.text) {
      try {
        const callback = async (response2) => {
          const memories = await sendTweet(
            this.client,
            response2,
            message.roomId,
            this.client.twitterConfig.TWITTER_USERNAME,
            tweet.id
          );
          return memories;
        };
        const responseMessages = await callback(response);
        state = await this.runtime.updateRecentMessageState(
          state
        );
        for (const responseMessage of responseMessages) {
          if (responseMessage === responseMessages[responseMessages.length - 1]) {
            responseMessage.content.action = response.action;
          } else {
            responseMessage.content.action = "CONTINUE";
          }
          await this.runtime.messageManager.createMemory(
            responseMessage
          );
        }
        await this.runtime.processActions(
          message,
          responseMessages,
          state,
          callback
        );
        const responseInfo = `Context:

${context}

Selected Post: ${tweet.id} - ${tweet.username}: ${tweet.text}
Agent's Output:
${response.text} + ${response.attachments[0]}`;
        await this.runtime.cacheManager.set(
          `twitter/tweet_generation_${tweet.id}.txt`,
          responseInfo
        );
        await wait();
      } catch (error) {
        elizaLogger11.error(`Error sending response tweet: ${error}`);
      }
    }
  }
  async buildConversationThread(tweet, maxReplies = 10) {
    const thread = [];
    const visited = /* @__PURE__ */ new Set();
    async function processThread(currentTweet, depth = 0) {
      elizaLogger11.log("Processing tweet:", {
        id: currentTweet.id,
        inReplyToStatusId: currentTweet.inReplyToStatusId,
        depth
      });
      if (!currentTweet) {
        elizaLogger11.log("No current tweet found for thread building");
        return;
      }
      if (depth >= maxReplies) {
        elizaLogger11.log("Reached maximum reply depth", depth);
        return;
      }
      const memory = await this.runtime.messageManager.getMemoryById(
        stringToUuid(currentTweet.id + "-" + this.runtime.agentId)
      );
      if (!memory) {
        const roomId = stringToUuid(
          currentTweet.conversationId + "-" + this.runtime.agentId
        );
        const userId = stringToUuid(currentTweet.userId);
        await this.runtime.ensureConnection(
          userId,
          roomId,
          currentTweet.username,
          currentTweet.name,
          "twitter"
        );
        this.runtime.messageManager.createMemory({
          id: stringToUuid(
            currentTweet.id + "-" + this.runtime.agentId
          ),
          agentId: this.runtime.agentId,
          content: {
            text: currentTweet.text,
            source: "twitter",
            url: currentTweet.permanentUrl,
            inReplyTo: currentTweet.inReplyToStatusId ? stringToUuid(
              currentTweet.inReplyToStatusId + "-" + this.runtime.agentId
            ) : void 0
          },
          createdAt: currentTweet.timestamp * 1e3,
          roomId,
          userId: currentTweet.userId === this.twitterUserId ? this.runtime.agentId : stringToUuid(currentTweet.userId),
          embedding: getEmbeddingZeroVector()
        });
      }
      if (visited.has(currentTweet.id)) {
        elizaLogger11.log("Already visited tweet:", currentTweet.id);
        return;
      }
      visited.add(currentTweet.id);
      thread.unshift(currentTweet);
      elizaLogger11.debug("Current thread state:", {
        length: thread.length,
        currentDepth: depth,
        tweetId: currentTweet.id
      });
      if (currentTweet.inReplyToStatusId) {
        elizaLogger11.log(
          "Fetching parent tweet:",
          currentTweet.inReplyToStatusId
        );
        try {
          const parentTweet = await this.twitterClient.getTweet(
            currentTweet.inReplyToStatusId
          );
          if (parentTweet) {
            elizaLogger11.log("Found parent tweet:", {
              id: parentTweet.id,
              text: parentTweet.text?.slice(0, 50)
            });
            await processThread(parentTweet, depth + 1);
          } else {
            elizaLogger11.log(
              "No parent tweet found for:",
              currentTweet.inReplyToStatusId
            );
          }
        } catch (error) {
          elizaLogger11.log("Error fetching parent tweet:", {
            tweetId: currentTweet.inReplyToStatusId,
            error
          });
        }
      } else {
        elizaLogger11.log(
          "Reached end of reply chain at:",
          currentTweet.id
        );
      }
    }
    await processThread.bind(this)(tweet, 0);
    elizaLogger11.debug("Final thread built:", {
      totalTweets: thread.length,
      tweetIds: thread.map((t) => ({
        id: t.id,
        text: t.text?.slice(0, 50)
      }))
    });
    return thread;
  }
};
var twitterPostTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{characterPostExamples}}

{{postDirections}}

# Task: Generate a post in the voice and style and perspective of {{agentName}} @{{twitterUserName}}.
Write a post that is {{adjective}} about {{topic}} (without mentioning {{topic}} directly), from the perspective of {{agentName}}. Do not add commentary or acknowledge this request, just write the post.
Your response should be 1, 2, or 3 sentences (choose the length at random).
Keep your response brief and concise as it MUST be less than {{maxTweetLength}} characters.
Your response should not contain any questions. Brief, concise statements only. The total character count MUST be less than {{maxTweetLength}}. No emojis. Use \\n\\n (double spaces) between statements if there are multiple statements in your response.`;
var twitterActionTemplate = `
# INSTRUCTIONS: Determine actions for {{agentName}} (@{{twitterUserName}}) based on:
{{bio}}
{{postDirections}}

Guidelines:
- Highly selective engagement
- Direct mentions are priority
- Skip: low-effort content, off-topic, repetitive

Actions (respond only with tags):
[LIKE] - Resonates with interests (9.5/10)
[RETWEET] - Perfect character alignment (9/10)
[QUOTE] - Can add unique value (8/10)
[REPLY] - Memetic opportunity (9/10)

Tweet:
{{currentTweet}}

# Respond with qualifying action tags only.` + postActionResponseFooter;
function truncateToCompleteSentence(text, maxTweetLength) {
  if (text.length <= maxTweetLength) {
    return text;
  }
  const lastPeriodIndex = text.lastIndexOf(".", maxTweetLength - 1);
  if (lastPeriodIndex !== -1) {
    const truncatedAtPeriod = text.slice(0, lastPeriodIndex + 1).trim();
    if (truncatedAtPeriod.length > 0) {
      return truncatedAtPeriod;
    }
  }
  const lastSpaceIndex = text.lastIndexOf(" ", maxTweetLength - 1);
  if (lastSpaceIndex !== -1) {
    const truncatedAtSpace = text.slice(0, lastSpaceIndex).trim();
    if (truncatedAtSpace.length > 0) {
      return truncatedAtSpace + "...";
    }
  }
  const hardTruncated = text.slice(0, maxTweetLength - 3).trim();
  return hardTruncated + "...";
}
var TwitterPostClient = class {
  client;
  runtime;
  twitterUsername;
  isProcessing = false;
  lastProcessTime = 0;
  stopProcessingActions = false;
  isDryRun;
  constructor(client, runtime) {
    this.client = client;
    this.runtime = runtime;
    this.twitterUsername = this.client.twitterConfig.TWITTER_USERNAME;
    this.isDryRun = this.client.twitterConfig.TWITTER_DRY_RUN;
    const targetUsers = this.client.twitterConfig.TWITTER_TARGET_USERS;
    if (targetUsers) {
    }
    if (this.isDryRun) {
    }
  }
  async start() {
    if (!this.client.profile) {
      await this.client.init();
    }
    const generateNewTweetLoop = async () => {
      const lastPost = await this.runtime.cacheManager.get("twitter/" + this.twitterUsername + "/lastPost");
      const lastPostTimestamp = lastPost?.timestamp ?? 0;
      const minMinutes = this.client.twitterConfig.POST_INTERVAL_MIN;
      const maxMinutes = this.client.twitterConfig.POST_INTERVAL_MAX;
      const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
      const delay = randomMinutes * 60 * 1e3;
      if (Date.now() > lastPostTimestamp + delay) {
        await this.generateNewTweet();
      }
      setTimeout(() => {
        generateNewTweetLoop();
      }, delay);
    };
    const processActionsLoop = async () => {
      const actionInterval = this.client.twitterConfig.ACTION_INTERVAL;
      while (!this.stopProcessingActions) {
        try {
          const results = await this.processTweetActions();
          if (results) {
            await new Promise(
              (resolve) => setTimeout(resolve, actionInterval * 60 * 1e3)
              // now in minutes
            );
          }
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, 3e4));
        }
      }
    };
    if (this.client.twitterConfig.POST_IMMEDIATELY) {
      await this.generateNewTweet();
    }
    if (!this.isDryRun) {
      generateNewTweetLoop();
      elizaLogger11.log("Tweet generation loop started");
    } else {
      elizaLogger11.log("Tweet generation loop disabled (dry run mode)");
    }
    if (this.client.twitterConfig.ENABLE_ACTION_PROCESSING && !this.isDryRun) {
      processActionsLoop().catch((error) => {
        elizaLogger11.error(
          "Fatal error in process actions loop:",
          error
        );
      });
    } else {
      if (this.isDryRun) {
        elizaLogger11.log(
          "Action processing loop disabled (dry run mode)"
        );
      } else {
        elizaLogger11.log(
          "Action processing loop disabled by configuration"
        );
      }
    }
  }
  createTweetObject(tweetResult, client, twitterUsername) {
    return {
      id: tweetResult.rest_id,
      name: client.profile.screenName,
      username: client.profile.username,
      text: tweetResult.legacy.full_text,
      conversationId: tweetResult.legacy.conversation_id_str,
      createdAt: tweetResult.legacy.created_at,
      timestamp: new Date(tweetResult.legacy.created_at).getTime(),
      userId: client.profile.id,
      inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
      permanentUrl: `https://twitter.com/${twitterUsername}/status/${tweetResult.rest_id}`,
      hashtags: [],
      mentions: [],
      photos: [],
      thread: [],
      urls: [],
      videos: []
    };
  }
  async processAndCacheTweet(runtime, client, tweet, roomId, newTweetContent) {
    await runtime.cacheManager.set(
      `twitter/${client.profile.username}/lastPost`,
      {
        id: tweet.id,
        timestamp: Date.now()
      }
    );
    await client.cacheTweet(tweet);
    elizaLogger11.log(`Tweet posted:
 ${tweet.permanentUrl}`);
    await runtime.ensureRoomExists(roomId);
    await runtime.ensureParticipantInRoom(runtime.agentId, roomId);
    await runtime.messageManager.createMemory({
      id: stringToUuid(tweet.id + "-" + runtime.agentId),
      userId: runtime.agentId,
      agentId: runtime.agentId,
      content: {
        text: newTweetContent.trim(),
        url: tweet.permanentUrl,
        source: "twitter"
      },
      roomId,
      embedding: getEmbeddingZeroVector(),
      createdAt: tweet.timestamp
    });
  }
  async handleNoteTweet(client, runtime, content, tweetId) {
    try {
      const noteTweetResult = await client.requestQueue.add(
        async () => await client.twitterClient.sendNoteTweet(content, tweetId)
      );
      if (noteTweetResult.errors && noteTweetResult.errors.length > 0) {
        const truncateContent = truncateToCompleteSentence(
          content,
          this.client.twitterConfig.MAX_TWEET_LENGTH
        );
        return await this.sendStandardTweet(
          client,
          truncateContent,
          tweetId
        );
      } else {
        return noteTweetResult.data.notetweet_create.tweet_results.result;
      }
    } catch (error) {
      throw new Error(`Note Tweet failed: ${error}`);
    }
  }
  async generateImgforPost(context) {
    const STYLE = "futuristic with vibrant colors";
    const IMAGE_PROMPT_INPUT = `You are tasked with generating an image prompt based on a content and a specified style.
          Your goal is to create a detailed and vivid image prompt that captures the essence of the content while incorporating an appropriate subject based on your analysis of the content.

You will be given the following inputs:
<content>
${context}
</content>

<style>
${STYLE}
</style>

A good image prompt consists of the following elements:



1. Main subject
2. Detailed description
3. Style
4. Lighting
5. Composition
6. Quality modifiers

To generate the image prompt, follow these steps:

1. Analyze the content text carefully, identifying key themes, emotions, and visual elements mentioned or implied.




2. Determine the most appropriate main subject by:
 - Identifying concrete objects or persons mentioned in the content
 - Analyzing the central theme or message
 - Considering metaphorical representations of abstract concepts
 - Selecting a subject that best captures the content's essence

3. Determine an appropriate environment or setting based on the content's context and your chosen subject.

4. Decide on suitable lighting that enhances the mood or atmosphere of the scene.

5. Choose a color palette that reflects the content's tone and complements the subject.

6. Identify the overall mood or emotion conveyed by the content.

7. Plan a composition that effectively showcases the subject and captures the content's essence.

8. Incorporate the specified style into your description, considering how it affects the overall look and feel of the image.

9. Use concrete nouns and avoid abstract concepts when describing the main subject and elements of the scene.

Construct your image prompt using the following structure:


1. Main subject: Describe the primary focus of the image based on your analysis
2. Environment: Detail the setting or background
3. Lighting: Specify the type and quality of light in the scene
4. Colors: Mention the key colors and their relationships
5. Mood: Convey the overall emotional tone
6. Composition: Describe how elements are arranged in the frame
7. Style: Incorporate the given style into the description

Ensure that your prompt is detailed, vivid, and incorporates all the elements mentioned above while staying true to the content and the specified style. LIMIT the image prompt 50 words or less. 

Write a prompt. Only include the prompt and nothing else.`;
    const IMAGE_SYSTEM_PROMPT = `You are an expert in writing prompts for AI art generation. You excel at creating detailed and creative visual descriptions. Incorporating specific elements naturally. Always aim for clear, descriptive language that generates a creative picture. Your output should only contain the description of the image contents, but NOT an instruction like "create an image that..."`;
    try {
      const imagePrompt = await generateText3({
        runtime: this.runtime,
        context: IMAGE_PROMPT_INPUT,
        modelClass: ModelClass7.MEDIUM,
        customSystemPrompt: IMAGE_SYSTEM_PROMPT
      });
      const data = {
        prompt: imagePrompt,
        width: 1024,
        height: 1024,
        hideWatermark: true,
        negativePrompt: "just a good image",
        count: 1
      };
      return await generateImage2(data, this.runtime);
    } catch (e) {
      elizaLogger11.error("ERROR WHILE GENERATION IMAGE");
    }
  }
  async sendStandardTweet(client, content, tweetId) {
    try {
      const imageUsageKey = `twitter/${client.profile.username}/imageUsage`;
      elizaLogger11.log("imageUsageKey", imageUsageKey);
      const imageUsage = await client.runtime.cacheManager.get(imageUsageKey) || { count: 0 };
      elizaLogger11.log("IMAGEUSAGE", imageUsage);
      let mediaFiles = [];
      if (imageUsage.count < 2) {
        const imgBufferData = await this.generateImgforPost(content);
        if (!imgBufferData || imgBufferData.data.length === 0) {
          throw new Error("Failed to generate image for the post.");
        }
        const filename = `generated_${Date.now()}.png`;
        const imgBuffer = imgBufferData.data[0];
        const filepath = imgBuffer.startsWith("http") ? await saveHeuristImage(imgBuffer, filename) : await saveBase64Image(imgBuffer, filename);
        mediaFiles.push({
          data: fs3.readFileSync(filepath),
          mediaType: "image/png"
        });
        await this.runtime.cacheManager.set(imageUsageKey, {
          count: imageUsage.count + 1
        }, {
          expires: (/* @__PURE__ */ new Date()).getTime() + 864e5
        });
      }
      const standardTweetResult = await client.requestQueue.add(async () => {
        try {
          return await client.twitterClient.sendTweet(content, tweetId, mediaFiles);
        } catch (e) {
          elizaLogger11.error("Error sending tweet:", e);
          throw e;
        }
      });
      if (!standardTweetResult) {
        throw new Error("Failed to send tweet: No response from Twitter API.");
      }
      const body = await standardTweetResult.json();
      if (!body?.data?.create_tweet?.tweet_results?.result) {
        console.error("Error sending tweet; Bad response:", body);
        throw new Error("Failed to send tweet: Bad response structure.");
      }
      return body.data.create_tweet.tweet_results.result;
    } catch (error) {
      console.error("Error sending standard Tweet:", error);
      throw error;
    }
  }
  async postTweet(runtime, client, cleanedContent, roomId, newTweetContent, twitterUsername) {
    try {
      elizaLogger11.log(`Posting new tweet:
`);
      let result;
      if (cleanedContent.length > DEFAULT_MAX_TWEET_LENGTH) {
        result = await this.handleNoteTweet(
          client,
          runtime,
          cleanedContent
        );
      } else {
        result = await this.sendStandardTweet(client, cleanedContent);
      }
      const tweet = this.createTweetObject(
        result,
        client,
        twitterUsername
      );
      await this.processAndCacheTweet(
        runtime,
        client,
        tweet,
        roomId,
        newTweetContent
      );
    } catch (error) {
      elizaLogger11.error("Error sending tweet:", error);
    }
  }
  /**
   * Generates and posts a new tweet. If isDryRun is true, only logs what would have been posted.
   */
  async generateNewTweet() {
    elizaLogger11.log("Generating new tweet");
    try {
      const roomId = stringToUuid(
        "twitter_generate_room-" + this.client.profile.username
      );
      await this.runtime.ensureUserExists(
        this.runtime.agentId,
        this.client.profile.username,
        this.runtime.character.name,
        "twitter"
      );
      const topics = this.runtime.character.topics.join(", ");
      const state = await this.runtime.composeState(
        {
          userId: this.runtime.agentId,
          roomId,
          agentId: this.runtime.agentId,
          content: {
            text: topics || "",
            action: "TWEET"
          }
        },
        {
          twitterUserName: this.client.profile.username
        }
      );
      const context = composeContext6({
        state,
        template: this.runtime.character.templates?.twitterPostTemplate || twitterPostTemplate
      });
      elizaLogger11.debug("generate post prompt:\n" + context);
      const newTweetContent = await generateText3({
        runtime: this.runtime,
        context,
        modelClass: ModelClass7.SMALL
      });
      let cleanedContent = "";
      try {
        const parsedResponse = JSON.parse(newTweetContent);
        if (parsedResponse.text) {
          cleanedContent = parsedResponse.text;
        } else if (typeof parsedResponse === "string") {
          cleanedContent = parsedResponse;
        }
      } catch (error) {
        error.linted = true;
        cleanedContent = newTweetContent.replace(/^\s*{?\s*"text":\s*"|"\s*}?\s*$/g, "").replace(/^['"](.*)['"]$/g, "$1").replace(/\\"/g, '"').replace(/\\n/g, "\n").trim();
      }
      if (!cleanedContent) {
        elizaLogger11.error(
          "Failed to extract valid content from response:",
          {
            rawResponse: newTweetContent,
            attempted: "JSON parsing"
          }
        );
        return;
      }
      const maxTweetLength = this.client.twitterConfig.MAX_TWEET_LENGTH;
      if (maxTweetLength) {
        cleanedContent = truncateToCompleteSentence(
          cleanedContent,
          maxTweetLength
        );
      }
      const removeQuotes = (str) => str.replace(/^['"](.*)['"]$/, "$1");
      const fixNewLines = (str) => str.replaceAll(/\\n/g, "\n");
      cleanedContent = removeQuotes(fixNewLines(cleanedContent));
      if (this.isDryRun) {
        elizaLogger11.info(
          `Dry run: would have posted tweet: ${cleanedContent}`
        );
        return;
      }
      try {
        elizaLogger11.log(`Posting new tweet:
 ${cleanedContent}`);
        this.postTweet(
          this.runtime,
          this.client,
          cleanedContent,
          roomId,
          newTweetContent,
          this.twitterUsername
        );
      } catch (error) {
        elizaLogger11.error("Error sending tweet:", error);
      }
    } catch (error) {
      elizaLogger11.error(error);
      elizaLogger11.error("Error generating new tweet:", error);
    }
  }
  //
  async generateTweetContent(tweetState, options) {
    const context = composeContext6({
      state: tweetState,
      template: options?.template || this.runtime.character.templates?.twitterPostTemplate || twitterPostTemplate
    });
    const response = await generateText3({
      runtime: this.runtime,
      context: options?.context || context,
      modelClass: ModelClass7.SMALL
    });
    elizaLogger11.debug("generate tweet content response:\n" + response);
    const cleanedResponse = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").replaceAll(/\\n/g, "\n").trim();
    try {
      const jsonResponse = JSON.parse(cleanedResponse);
      if (jsonResponse.text) {
        return this.trimTweetLength(jsonResponse.text);
      }
      if (typeof jsonResponse === "object") {
        const possibleContent = jsonResponse.content || jsonResponse.message || jsonResponse.response;
        if (possibleContent) {
          return this.trimTweetLength(possibleContent);
        }
      }
    } catch (error) {
      error.linted = true;
      elizaLogger11.debug("Response is not JSON, treating as plain text");
    }
    return this.trimTweetLength(cleanedResponse);
  }
  // Helper method to ensure tweet length compliance
  trimTweetLength(text, maxLength = 280) {
    if (text.length <= maxLength) return text;
    const lastSentence = text.slice(0, maxLength).lastIndexOf(".");
    if (lastSentence > 0) {
      return text.slice(0, lastSentence + 1).trim();
    }
    return text.slice(0, text.lastIndexOf(" ", maxLength - 3)).trim() + "...";
  }
  /**
   * Processes tweet actions (likes, retweets, quotes, replies). If isDryRun is true,
   * only simulates and logs actions without making API calls.
   */
  async processTweetActions() {
    if (this.isProcessing) {
      elizaLogger11.log("Already processing tweet actions, skipping");
      return null;
    }
    try {
      this.isProcessing = true;
      this.lastProcessTime = Date.now();
      elizaLogger11.log("Processing tweet actions");
      if (this.isDryRun) {
        elizaLogger11.log("Dry run mode: simulating tweet actions");
        return [];
      }
      await this.runtime.ensureUserExists(
        this.runtime.agentId,
        this.twitterUsername,
        this.runtime.character.name,
        "twitter"
      );
      const homeTimeline = await this.client.fetchTimelineForActions(15);
      const results = [];
      for (const tweet of homeTimeline) {
        try {
          const memory = await this.runtime.messageManager.getMemoryById(
            stringToUuid(tweet.id + "-" + this.runtime.agentId)
          );
          if (memory) {
            elizaLogger11.log(
              `Already processed tweet ID: ${tweet.id}`
            );
            continue;
          }
          const roomId = stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
          );
          const tweetState = await this.runtime.composeState(
            {
              userId: this.runtime.agentId,
              roomId,
              agentId: this.runtime.agentId,
              content: { text: "", action: "" }
            },
            {
              twitterUserName: this.twitterUsername,
              currentTweet: `ID: ${tweet.id}
From: ${tweet.name} (@${tweet.username})
Text: ${tweet.text}`
            }
          );
          const actionContext = composeContext6({
            state: tweetState,
            template: this.runtime.character.templates?.twitterActionTemplate || twitterActionTemplate
          });
          const actionResponse = await generateTweetActions({
            runtime: this.runtime,
            context: actionContext,
            modelClass: ModelClass7.SMALL
          });
          if (!actionResponse) {
            elizaLogger11.log(
              `No valid actions generated for tweet ${tweet.id}`
            );
            continue;
          }
          const executedActions = [];
          if (actionResponse.like) {
            try {
              if (this.isDryRun) {
                elizaLogger11.info(
                  `Dry run: would have liked tweet ${tweet.id}`
                );
                executedActions.push("like (dry run)");
              } else {
                await this.client.twitterClient.likeTweet(
                  tweet.id
                );
                executedActions.push("like");
                elizaLogger11.log(`Liked tweet ${tweet.id}`);
              }
            } catch (error) {
              elizaLogger11.error(
                `Error liking tweet ${tweet.id}:`,
                error
              );
            }
          }
          if (actionResponse.retweet) {
            try {
              if (this.isDryRun) {
                elizaLogger11.info(
                  `Dry run: would have retweeted tweet ${tweet.id}`
                );
                executedActions.push("retweet (dry run)");
              } else {
                await this.client.twitterClient.retweet(
                  tweet.id
                );
                executedActions.push("retweet");
                elizaLogger11.log(`Retweeted tweet ${tweet.id}`);
              }
            } catch (error) {
              elizaLogger11.error(
                `Error retweeting tweet ${tweet.id}:`,
                error
              );
            }
          }
          if (actionResponse.quote) {
            try {
              if (this.isDryRun) {
                elizaLogger11.info(
                  `Dry run: would have posted quote tweet for ${tweet.id}`
                );
                executedActions.push("quote (dry run)");
                continue;
              }
              const thread = await buildConversationThread(
                tweet,
                this.client
              );
              const formattedConversation = thread.map(
                (t) => `@${t.username} (${new Date(t.timestamp * 1e3).toLocaleString()}): ${t.text}`
              ).join("\n\n");
              const imageDescriptions = [];
              if (tweet.photos?.length > 0) {
                elizaLogger11.log(
                  "Processing images in tweet for context"
                );
                for (const photo of tweet.photos) {
                  const description = await this.runtime.getService(
                    ServiceType4.IMAGE_DESCRIPTION
                  ).describeImage(photo.url);
                  imageDescriptions.push(description);
                }
              }
              let quotedContent = "";
              if (tweet.quotedStatusId) {
                try {
                  const quotedTweet = await this.client.twitterClient.getTweet(
                    tweet.quotedStatusId
                  );
                  if (quotedTweet) {
                    quotedContent = `
Quoted Tweet from @${quotedTweet.username}:
${quotedTweet.text}`;
                  }
                } catch (error) {
                  elizaLogger11.error(
                    "Error fetching quoted tweet:",
                    error
                  );
                }
              }
              const enrichedState = await this.runtime.composeState(
                {
                  userId: this.runtime.agentId,
                  roomId: stringToUuid(
                    tweet.conversationId + "-" + this.runtime.agentId
                  ),
                  agentId: this.runtime.agentId,
                  content: {
                    text: tweet.text,
                    action: "QUOTE"
                  }
                },
                {
                  twitterUserName: this.twitterUsername,
                  currentPost: `From @${tweet.username}: ${tweet.text}`,
                  formattedConversation,
                  imageContext: imageDescriptions.length > 0 ? `
Images in Tweet:
${imageDescriptions.map((desc, i) => `Image ${i + 1}: ${desc}`).join("\n")}` : "",
                  quotedContent
                }
              );
              const quoteContent = await this.generateTweetContent(enrichedState, {
                template: this.runtime.character.templates?.twitterMessageHandlerTemplate || twitterMessageHandlerTemplate
              });
              if (!quoteContent) {
                elizaLogger11.error(
                  "Failed to generate valid quote tweet content"
                );
                return;
              }
              elizaLogger11.log(
                "Generated quote tweet content:",
                quoteContent
              );
              const result = await this.client.requestQueue.add(
                async () => await this.client.twitterClient.sendQuoteTweet(
                  quoteContent,
                  tweet.id
                )
              );
              const body = await result.json();
              if (body?.data?.create_tweet?.tweet_results?.result) {
                elizaLogger11.log(
                  "Successfully posted quote tweet"
                );
                executedActions.push("quote");
                await this.runtime.cacheManager.set(
                  `twitter/quote_generation_${tweet.id}.txt`,
                  `Context:
${enrichedState}

Generated Quote:
${quoteContent}`
                );
              } else {
                elizaLogger11.error(
                  "Quote tweet creation failed:",
                  body
                );
              }
            } catch (error) {
              elizaLogger11.error(
                "Error in quote tweet generation:",
                error
              );
            }
          }
          if (actionResponse.reply) {
            try {
              await this.handleTextOnlyReply(
                tweet,
                tweetState,
                executedActions
              );
            } catch (error) {
              elizaLogger11.error(
                `Error replying to tweet ${tweet.id}:`,
                error
              );
            }
          }
          await this.runtime.ensureRoomExists(roomId);
          await this.runtime.ensureUserExists(
            stringToUuid(tweet.userId),
            tweet.username,
            tweet.name,
            "twitter"
          );
          await this.runtime.ensureParticipantInRoom(
            this.runtime.agentId,
            roomId
          );
          await this.runtime.messageManager.createMemory({
            id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
            userId: stringToUuid(tweet.userId),
            content: {
              text: tweet.text,
              url: tweet.permanentUrl,
              source: "twitter",
              action: executedActions.join(",")
            },
            agentId: this.runtime.agentId,
            roomId,
            embedding: getEmbeddingZeroVector(),
            createdAt: tweet.timestamp * 1e3
          });
          results.push({
            tweetId: tweet.id,
            parsedActions: actionResponse,
            executedActions
          });
        } catch (error) {
          elizaLogger11.error(
            `Error processing tweet ${tweet.id}:`,
            error
          );
          continue;
        }
      }
      return results;
    } catch (error) {
      elizaLogger11.error("Error in processTweetActions:", error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
  /**
   * Handles text-only replies to tweets. If isDryRun is true, only logs what would
   * have been replied without making API calls.
   */
  async handleTextOnlyReply(tweet, tweetState, executedActions) {
    try {
      const thread = await buildConversationThread(tweet, this.client);
      const formattedConversation = thread.map(
        (t) => `@${t.username} (${new Date(t.timestamp * 1e3).toLocaleString()}): ${t.text}`
      ).join("\n\n");
      const imageDescriptions = [];
      if (tweet.photos?.length > 0) {
        elizaLogger11.log("Processing images in tweet for context");
        for (const photo of tweet.photos) {
          const description = await this.runtime.getService(
            ServiceType4.IMAGE_DESCRIPTION
          ).describeImage(photo.url);
          imageDescriptions.push(description);
        }
      }
      let quotedContent = "";
      if (tweet.quotedStatusId) {
        try {
          const quotedTweet = await this.client.twitterClient.getTweet(
            tweet.quotedStatusId
          );
          if (quotedTweet) {
            quotedContent = `
Quoted Tweet from @${quotedTweet.username}:
${quotedTweet.text}`;
          }
        } catch (error) {
          elizaLogger11.error("Error fetching quoted tweet:", error);
        }
      }
      const enrichedState = await this.runtime.composeState(
        {
          userId: this.runtime.agentId,
          roomId: stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
          ),
          agentId: this.runtime.agentId,
          content: { text: tweet.text, action: "" }
        },
        {
          twitterUserName: this.twitterUsername,
          currentPost: `From @${tweet.username}: ${tweet.text}`,
          formattedConversation,
          imageContext: imageDescriptions.length > 0 ? `
Images in Tweet:
${imageDescriptions.map((desc, i) => `Image ${i + 1}: ${desc}`).join("\n")}` : "",
          quotedContent
        }
      );
      const replyText = await this.generateTweetContent(enrichedState, {
        template: this.runtime.character.templates?.twitterMessageHandlerTemplate || twitterMessageHandlerTemplate
      });
      if (!replyText) {
        elizaLogger11.error("Failed to generate valid reply content");
        return;
      }
      if (this.isDryRun) {
        elizaLogger11.info(
          `Dry run: reply to tweet ${tweet.id} would have been: ${replyText}`
        );
        executedActions.push("reply (dry run)");
        return;
      }
      elizaLogger11.debug("Final reply text to be sent:", replyText);
      let result;
      if (replyText.length > DEFAULT_MAX_TWEET_LENGTH) {
        result = await this.handleNoteTweet(
          this.client,
          this.runtime,
          replyText,
          tweet.id
        );
      } else {
        result = await this.sendStandardTweet(
          this.client,
          replyText,
          tweet.id
        );
      }
      if (result) {
        elizaLogger11.log("Successfully posted reply tweet");
        executedActions.push("reply");
        await this.runtime.cacheManager.set(
          `twitter/reply_generation_${tweet.id}.txt`,
          `Context:
${enrichedState}

Generated Reply:
${replyText}`
        );
      } else {
        elizaLogger11.error("Tweet reply creation failed");
      }
    } catch (error) {
      elizaLogger11.error("Error in handleTextOnlyReply:", error);
    }
  }
  async stop() {
    this.stopProcessingActions = true;
  }
};
var twitterSearchTemplate = `{{timeline}}

{{providers}}

Recent interactions between {{agentName}} and other users:
{{recentPostInteractions}}

About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{postDirections}}

{{recentPosts}}

# Task: Respond to the following post in the style and perspective of {{agentName}} (aka @{{twitterUserName}}). Write a {{adjective}} response for {{agentName}} to say directly in response to the post. don't generalize.
{{currentPost}}

IMPORTANT: Your response CANNOT be longer than 20 words.
Aim for 1-2 short sentences maximum. Be concise and direct.

Your response should not contain any questions. Brief, concise statements only. No emojis. Use \\n\\n (double spaces) between statements.

` + messageCompletionFooter;
var TwitterSearchClient = class {
  client;
  runtime;
  twitterUsername;
  respondedTweets = /* @__PURE__ */ new Set();
  constructor(client, runtime) {
    this.client = client;
    this.runtime = runtime;
    this.twitterUsername = this.client.twitterConfig.TWITTER_USERNAME;
  }
  async start() {
    this.engageWithSearchTermsLoop();
  }
  engageWithSearchTermsLoop() {
    this.engageWithSearchTerms().then();
    const randomMinutes = Math.floor(Math.random() * (120 - 60 + 1)) + 60;
    elizaLogger11.log(`Next twitter search scheduled in ${randomMinutes} minutes`);
    setTimeout(
      () => this.engageWithSearchTermsLoop(),
      randomMinutes * 60 * 1e3
    );
  }
  async engageWithSearchTerms() {
    console.log("Engaging with search terms");
    try {
      const searchTerm = [...this.runtime.character.topics][Math.floor(Math.random() * this.runtime.character.topics.length)];
      console.log("Fetching search tweets");
      await new Promise((resolve) => setTimeout(resolve, 5e3));
      const recentTweets = await this.client.fetchSearchTweets(
        searchTerm,
        20,
        SearchMode.Top
      );
      console.log("Search tweets fetched");
      const homeTimeline = await this.client.fetchHomeTimeline(50);
      await this.client.cacheTimeline(homeTimeline);
      const formattedHomeTimeline = `# ${this.runtime.character.name}'s Home Timeline

` + homeTimeline.map((tweet) => {
        return `ID: ${tweet.id}
From: ${tweet.name} (@${tweet.username})${tweet.inReplyToStatusId ? ` In reply to: ${tweet.inReplyToStatusId}` : ""}
Text: ${tweet.text}
---
`;
      }).join("\n");
      const slicedTweets = recentTweets.tweets.sort(() => Math.random() - 0.5).slice(0, 20);
      if (slicedTweets.length === 0) {
        console.log(
          "No valid tweets found for the search term",
          searchTerm
        );
        return;
      }
      const prompt = `
  Here are some tweets related to the search term "${searchTerm}":

  ${[...slicedTweets, ...homeTimeline].filter((tweet) => {
        const thread = tweet.thread;
        const botTweet = thread.find(
          (t) => t.username === this.twitterUsername
        );
        return !botTweet;
      }).map(
        (tweet) => `
    ID: ${tweet.id}${tweet.inReplyToStatusId ? ` In reply to: ${tweet.inReplyToStatusId}` : ""}
    From: ${tweet.name} (@${tweet.username})
    Text: ${tweet.text}
  `
      ).join("\n")}

  Which tweet is the most interesting and relevant for Ruby to reply to? Please provide only the ID of the tweet in your response.
  Notes:
    - Respond to English tweets only
    - Respond to tweets that don't have a lot of hashtags, links, URLs or images
    - Respond to tweets that are not retweets
    - Respond to tweets where there is an easy exchange of ideas to have with the user
    - ONLY respond with the ID of the tweet`;
      const mostInterestingTweetResponse = await generateText3({
        runtime: this.runtime,
        context: prompt,
        modelClass: ModelClass7.SMALL
      });
      const tweetId = mostInterestingTweetResponse.trim();
      const selectedTweet = slicedTweets.find(
        (tweet) => tweet.id.toString().includes(tweetId) || tweetId.includes(tweet.id.toString())
      );
      if (!selectedTweet) {
        console.log("No matching tweet found for the selected ID");
        return console.log("Selected tweet ID:", tweetId);
      }
      console.log("Selected tweet to reply to:", selectedTweet?.text);
      if (selectedTweet.username === this.twitterUsername) {
        console.log("Skipping tweet from bot itself");
        return;
      }
      const conversationId = selectedTweet.conversationId;
      const roomId = stringToUuid(
        conversationId + "-" + this.runtime.agentId
      );
      const userIdUUID = stringToUuid(selectedTweet.userId);
      await this.runtime.ensureConnection(
        userIdUUID,
        roomId,
        selectedTweet.username,
        selectedTweet.name,
        "twitter"
      );
      await buildConversationThread(selectedTweet, this.client);
      const message = {
        id: stringToUuid(selectedTweet.id + "-" + this.runtime.agentId),
        agentId: this.runtime.agentId,
        content: {
          text: selectedTweet.text,
          url: selectedTweet.permanentUrl,
          inReplyTo: selectedTweet.inReplyToStatusId ? stringToUuid(
            selectedTweet.inReplyToStatusId + "-" + this.runtime.agentId
          ) : void 0
        },
        userId: userIdUUID,
        roomId,
        // Timestamps are in seconds, but we need them in milliseconds
        createdAt: selectedTweet.timestamp * 1e3
      };
      if (!message.content.text) {
        return { text: "", action: "IGNORE" };
      }
      const replies = selectedTweet.thread;
      const replyContext = replies.filter((reply) => reply.username !== this.twitterUsername).map((reply) => `@${reply.username}: ${reply.text}`).join("\n");
      let tweetBackground = "";
      if (selectedTweet.isRetweet) {
        const originalTweet = await this.client.requestQueue.add(
          () => this.client.twitterClient.getTweet(selectedTweet.id)
        );
        tweetBackground = `Retweeting @${originalTweet.username}: ${originalTweet.text}`;
      }
      const imageDescriptions = [];
      for (const photo of selectedTweet.photos) {
        const description = await this.runtime.getService(
          ServiceType4.IMAGE_DESCRIPTION
        ).describeImage(photo.url);
        imageDescriptions.push(description);
      }
      let state = await this.runtime.composeState(message, {
        twitterClient: this.client.twitterClient,
        twitterUserName: this.twitterUsername,
        timeline: formattedHomeTimeline,
        tweetContext: `${tweetBackground}

  Original Post:
  By @${selectedTweet.username}
  ${selectedTweet.text}${replyContext.length > 0 && `
Replies to original post:
${replyContext}`}
  ${`Original post text: ${selectedTweet.text}`}
  ${selectedTweet.urls.length > 0 ? `URLs: ${selectedTweet.urls.join(", ")}
` : ""}${imageDescriptions.length > 0 ? `
Images in Post (Described): ${imageDescriptions.join(", ")}
` : ""}
  `
      });
      await this.client.saveRequestMessage(message, state);
      const context = composeContext6({
        state,
        template: this.runtime.character.templates?.twitterSearchTemplate || twitterSearchTemplate
      });
      const responseContent = await generateMessageResponse({
        runtime: this.runtime,
        context,
        modelClass: ModelClass7.LARGE
      });
      responseContent.inReplyTo = message.id;
      const response = responseContent;
      if (!response.text) {
        console.log("Returning: No response text found");
        return;
      }
      console.log(
        `Bot would respond to tweet ${selectedTweet.id} with: ${response.text}`
      );
      try {
        const callback = async (response2) => {
          const memories = await sendTweet(
            this.client,
            response2,
            message.roomId,
            this.twitterUsername,
            tweetId
          );
          return memories;
        };
        const responseMessages = await callback(responseContent);
        state = await this.runtime.updateRecentMessageState(state);
        for (const responseMessage of responseMessages) {
          await this.runtime.messageManager.createMemory(
            responseMessage,
            false
          );
        }
        state = await this.runtime.updateRecentMessageState(state);
        await this.runtime.evaluate(message, state);
        await this.runtime.processActions(
          message,
          responseMessages,
          state,
          callback
        );
        this.respondedTweets.add(selectedTweet.id);
        const responseInfo = `Context:

${context}

Selected Post: ${selectedTweet.id} - ${selectedTweet.username}: ${selectedTweet.text}
Agent's Output:
${response.text}`;
        await this.runtime.cacheManager.set(
          `twitter/tweet_generation_${selectedTweet.id}.txt`,
          responseInfo
        );
        await wait();
      } catch (error) {
        console.error(`Error sending response post: ${error}`);
      }
    } catch (error) {
      console.error("Error engaging with search terms:", error);
    }
  }
};
var wait = (minTime = 1e3, maxTime = 3e3) => {
  const waitTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};
async function buildConversationThread(tweet, client, maxReplies = 10) {
  const thread = [];
  const visited = /* @__PURE__ */ new Set();
  async function processThread(currentTweet, depth = 0) {
    elizaLogger11.debug("Processing tweet:", {
      id: currentTweet.id,
      inReplyToStatusId: currentTweet.inReplyToStatusId,
      depth
    });
    if (!currentTweet) {
      elizaLogger11.debug("No current tweet found for thread building");
      return;
    }
    if (depth >= maxReplies) {
      elizaLogger11.debug("Reached maximum reply depth", depth);
      return;
    }
    const memory = await client.runtime.messageManager.getMemoryById(
      stringToUuid(currentTweet.id + "-" + client.runtime.agentId)
    );
    if (!memory) {
      const roomId = stringToUuid(
        currentTweet.conversationId + "-" + client.runtime.agentId
      );
      const userId = stringToUuid(currentTweet.userId);
      await client.runtime.ensureConnection(
        userId,
        roomId,
        currentTweet.username,
        currentTweet.name,
        "twitter"
      );
      await client.runtime.messageManager.createMemory({
        id: stringToUuid(
          currentTweet.id + "-" + client.runtime.agentId
        ),
        agentId: client.runtime.agentId,
        content: {
          text: currentTweet.text,
          source: "twitter",
          url: currentTweet.permanentUrl,
          inReplyTo: currentTweet.inReplyToStatusId ? stringToUuid(
            currentTweet.inReplyToStatusId + "-" + client.runtime.agentId
          ) : void 0
        },
        createdAt: currentTweet.timestamp * 1e3,
        roomId,
        userId: currentTweet.userId === client.profile.id ? client.runtime.agentId : stringToUuid(currentTweet.userId),
        embedding: getEmbeddingZeroVector()
      });
    }
    if (visited.has(currentTweet.id)) {
      elizaLogger11.debug("Already visited tweet:", currentTweet.id);
      return;
    }
    visited.add(currentTweet.id);
    thread.unshift(currentTweet);
    elizaLogger11.debug("Current thread state:", {
      length: thread.length,
      currentDepth: depth,
      tweetId: currentTweet.id
    });
    if (currentTweet.inReplyToStatusId) {
      elizaLogger11.debug(
        "Fetching parent tweet:",
        currentTweet.inReplyToStatusId
      );
      try {
        const parentTweet = await client.twitterClient.getTweet(
          currentTweet.inReplyToStatusId
        );
        if (parentTweet) {
          elizaLogger11.debug("Found parent tweet:", {
            id: parentTweet.id,
            text: parentTweet.text?.slice(0, 50)
          });
          await processThread(parentTweet, depth + 1);
        } else {
          elizaLogger11.debug(
            "No parent tweet found for:",
            currentTweet.inReplyToStatusId
          );
        }
      } catch (error) {
        elizaLogger11.error("Error fetching parent tweet:", {
          tweetId: currentTweet.inReplyToStatusId,
          error
        });
      }
    } else {
      elizaLogger11.debug(
        "Reached end of reply chain at:",
        currentTweet.id
      );
    }
  }
  await processThread(tweet, 0);
  elizaLogger11.debug("Final thread built:", {
    totalTweets: thread.length,
    tweetIds: thread.map((t) => ({
      id: t.id,
      text: t.text?.slice(0, 50)
    }))
  });
  return thread;
}
async function sendTweet(client, content, roomId, twitterUsername, inReplyTo) {
  const maxTweetLength = client.twitterConfig.MAX_TWEET_LENGTH;
  const isLongTweet = maxTweetLength > 280;
  const tweetChunks = splitTweetContent(content.text, maxTweetLength);
  const sentTweets = [];
  let previousTweetId = inReplyTo;
  for (const chunk of tweetChunks) {
    let mediaData;
    if (content.attachments && content.attachments.length > 0) {
      mediaData = await Promise.all(
        content.attachments.map(async (attachment) => {
          if (/^(http|https):\/\//.test(attachment.url)) {
            const response = await fetch(attachment.url);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch file: ${attachment.url}`
              );
            }
            const mediaBuffer = Buffer.from(
              await response.arrayBuffer()
            );
            const mediaType = attachment.contentType;
            return { data: mediaBuffer, mediaType };
          } else if (fs3.existsSync(attachment.url)) {
            const mediaBuffer = await fs3.promises.readFile(
              path5.resolve(attachment.url)
            );
            const mediaType = attachment.contentType;
            return { data: mediaBuffer, mediaType };
          } else {
            throw new Error(
              `File not found: ${attachment.url}. Make sure the path is correct.`
            );
          }
        })
      );
    }
    const result = await client.requestQueue.add(
      async () => isLongTweet ? client.twitterClient.sendLongTweet(chunk.trim(), previousTweetId, mediaData) : client.twitterClient.sendTweet(chunk.trim(), previousTweetId, mediaData)
    );
    const body = await result.json();
    const tweetResult = isLongTweet ? body.data.notetweet_create.tweet_results.result : body.data.create_tweet.tweet_results.result;
    if (tweetResult) {
      const finalTweet = {
        id: tweetResult.rest_id,
        text: tweetResult.legacy.full_text,
        conversationId: tweetResult.legacy.conversation_id_str,
        timestamp: new Date(tweetResult.legacy.created_at).getTime() / 1e3,
        userId: tweetResult.legacy.user_id_str,
        inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
        permanentUrl: `https://twitter.com/${twitterUsername}/status/${tweetResult.rest_id}`,
        hashtags: [],
        mentions: [],
        photos: [],
        thread: [],
        urls: [],
        videos: []
      };
      sentTweets.push(finalTweet);
      previousTweetId = finalTweet.id;
    } else {
      elizaLogger11.error("Error sending tweet chunk:", { chunk, response: body });
    }
    await wait(1e3, 2e3);
  }
  const memories = sentTweets.map((tweet) => ({
    id: stringToUuid(tweet.id + "-" + client.runtime.agentId),
    agentId: client.runtime.agentId,
    userId: client.runtime.agentId,
    content: {
      text: tweet.text,
      source: "twitter",
      url: tweet.permanentUrl,
      inReplyTo: tweet.inReplyToStatusId ? stringToUuid(
        tweet.inReplyToStatusId + "-" + client.runtime.agentId
      ) : void 0
    },
    roomId,
    embedding: getEmbeddingZeroVector(),
    createdAt: tweet.timestamp * 1e3
  }));
  return memories;
}
function splitTweetContent(content, maxLength) {
  const paragraphs = content.split("\n\n").map((p) => p.trim());
  const tweets = [];
  let currentTweet = "";
  for (const paragraph of paragraphs) {
    if (!paragraph) continue;
    if ((currentTweet + "\n\n" + paragraph).trim().length <= maxLength) {
      if (currentTweet) {
        currentTweet += "\n\n" + paragraph;
      } else {
        currentTweet = paragraph;
      }
    } else {
      if (currentTweet) {
        tweets.push(currentTweet.trim());
      }
      if (paragraph.length <= maxLength) {
        currentTweet = paragraph;
      } else {
        const chunks = splitParagraph(paragraph, maxLength);
        tweets.push(...chunks.slice(0, -1));
        currentTweet = chunks[chunks.length - 1];
      }
    }
  }
  if (currentTweet) {
    tweets.push(currentTweet.trim());
  }
  return tweets;
}
function splitParagraph(paragraph, maxLength) {
  const sentences = paragraph.match(/[^\.!\?]+[\.!\?]+|[^\.!\?]+$/g) || [
    paragraph
  ];
  const chunks = [];
  let currentChunk = "";
  for (const sentence of sentences) {
    if ((currentChunk + " " + sentence).trim().length <= maxLength) {
      if (currentChunk) {
        currentChunk += " " + sentence;
      } else {
        currentChunk = sentence;
      }
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      if (sentence.length <= maxLength) {
        currentChunk = sentence;
      } else {
        const words = sentence.split(" ");
        currentChunk = "";
        for (const word of words) {
          if ((currentChunk + " " + word).trim().length <= maxLength) {
            if (currentChunk) {
              currentChunk += " " + word;
            } else {
              currentChunk = word;
            }
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = word;
          }
        }
      }
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}
var TwitterManager = class {
  client;
  post;
  search;
  interaction;
  constructor(runtime, twitterConfig) {
    this.client = new ClientBase(runtime, twitterConfig);
    this.post = new TwitterPostClient(this.client, runtime);
    if (twitterConfig.TWITTER_SEARCH_ENABLE) {
      elizaLogger11.warn("Twitter/X client running in a mode that:");
      elizaLogger11.warn("1. violates consent of random users");
      elizaLogger11.warn("2. burns your rate limit");
      elizaLogger11.warn("3. can get your account banned");
      elizaLogger11.warn("use at your own risk");
      this.search = new TwitterSearchClient(this.client, runtime);
    }
    this.interaction = new TwitterInteractionClient(this.client, runtime);
  }
};
var TwitterClientInterface = {
  async start(runtime) {
    const twitterConfig = await validateTwitterConfig(runtime);
    const manager = new TwitterManager(runtime, twitterConfig);
    await manager.client.init();
    await manager.post.start();
    if (manager.search)
      await manager.search.start();
    await manager.interaction.start();
    return manager;
  },
  async stop(_runtime) {
  }
};
var client_twitter_default = TwitterClientInterface;

// src/index.ts
var expressApp = express();
configDotenv();
var __filename = fileURLToPath2(import.meta.url);
var __dirname = path6.dirname(__filename);
var wait2 = (minTime = 1e3, maxTime = 3e3) => {
  const waitTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};
function getTokenForProvider(provider, character) {
  switch (provider) {
    case ModelProviderName5.OPENAI:
      return character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY;
    case ModelProviderName5.LLAMACLOUD:
      return character.settings?.secrets?.LLAMACLOUD_API_KEY || settings.LLAMACLOUD_API_KEY || character.settings?.secrets?.TOGETHER_API_KEY || settings.TOGETHER_API_KEY || character.settings?.secrets?.XAI_API_KEY || settings.XAI_API_KEY || character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY;
    case ModelProviderName5.ANTHROPIC:
      return character.settings?.secrets?.ANTHROPIC_API_KEY || character.settings?.secrets?.CLAUDE_API_KEY || settings.ANTHROPIC_API_KEY || settings.CLAUDE_API_KEY;
    case ModelProviderName5.REDPILL:
      return character.settings?.secrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY;
    case ModelProviderName5.OPENROUTER:
      return character.settings?.secrets?.OPENROUTER || settings.OPENROUTER_API_KEY;
    case ModelProviderName5.GROK:
      return character.settings?.secrets?.GROK_API_KEY || settings.GROK_API_KEY;
    case ModelProviderName5.HEURIST:
      return character.settings?.secrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY;
    case ModelProviderName5.GROQ:
      return character.settings?.secrets?.GROQ_API_KEY || settings.GROQ_API_KEY;
  }
}
function initializeDatabaseClient() {
  const DATABASE_URL = process.env.MONGODB_URL || "";
  return new MongoClient(DATABASE_URL);
}
async function initializeClients(character, runtime) {
  const clients = [];
  const clientTypes = character.clients?.map((str) => str.toLowerCase()) || [];
  if (clientTypes.includes("auto")) {
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
    const twitterClients = await client_twitter_default.start(runtime);
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
var nodePlugin;
function createAgent(character, db, cache, token) {
  elizaLogger12.success(
    elizaLogger12.successesTitle,
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
    cacheManager: cache
  });
}
async function startAgent(character, database) {
  try {
    const token = getTokenForProvider(character.modelProvider, character);
    const cache = new CacheManager(new DbCacheAdapter(database, character.id));
    const runtime = createAgent(character, database, cache, token);
    agentsManager.addAgent(runtime.agentId, runtime);
    await runtime.initialize();
    const cookies = runtime.getSetting("TWITTER_COOKIES");
    const username = runtime.getSetting("TWITTER_USERNAME");
    if (cookies) {
      elizaLogger12.log(`Reading cookies from SETTINGS...`);
      await runtime.cacheManager.set(
        `twitter/${username}/cookies`,
        JSON.parse(cookies)
      );
    }
    return initializeClients(character, runtime);
  } catch (error) {
    elizaLogger12.error(
      `Error starting agent for character ${character.name}:`,
      error
    );
    throw error;
  }
}
var killAgent = async (agentId) => {
  try {
    const agent = agentsManager.getAgent(agentId);
    await agent.stop();
    agentsManager.removeAgent(agentId);
    elizaLogger12.success(`Agent stopped: ${agentId}`);
  } catch (error) {
    elizaLogger12.error(`Failed to stop agent: ${agentId}`);
  }
};
var verifySecretKey = (secretKey) => {
  return secretKey === process.env.ELIZA_API_SECRET_KEY;
};
var initializeExpressApp = (elizaMongodbAdapter) => {
  expressApp.get("/health", (request, response) => {
    response.status(200).send("OK");
  });
  expressApp.post(
    "/agents/change",
    bodyParser.json({}),
    async (request, response) => {
      const {
        type,
        agent,
        secretKey
      } = request.body;
      if (!verifySecretKey(secretKey)) {
        response.status(401).send({ status: "Unauthorized" });
        return;
      }
      if (type === "add") {
        await startAgent(generateCharacter(agent), elizaMongodbAdapter);
      }
      if (type === "remove") {
        await killAgent(agent.id);
      }
      if (type === "update") {
        await killAgent(agent.id);
        await startAgent(generateCharacter(agent), elizaMongodbAdapter);
      }
      response.status(200).send({ status: "OK" });
    }
  );
  expressApp.post(
    "/agents/communicate",
    bodyParser.json({}),
    async (request, response) => {
      const {
        requestContent,
        interactionId,
        organizationId,
        secretKey
      } = request.body;
      if (!verifySecretKey(secretKey)) {
        response.status(401).send({ status: "Unauthorized" });
        return;
      }
      sendInteractionToProducer(
        interactionId,
        organizationId,
        requestContent
      ).catch((error) => {
        console.error("Error sending interaction to producer:", error);
      });
      response.status(200).send({ status: "OK" });
    }
  );
  expressApp.listen(process.env.EXPRESS_APP_PORT || 3001, () => {
    console.log(`Express app is running on port ${process.env.EXPRESS_APP_PORT || 3001}`);
  });
};
var initializeAgentsSystem = async () => {
  const dataDir = path6.join(__dirname, "../data");
  if (!fs4.existsSync(dataDir)) {
    fs4.mkdirSync(dataDir, { recursive: true });
  }
  const databaseClient = initializeDatabaseClient();
  const databaseName = process.env.MONGODB_NAME || "ai-office";
  const elizaMongodbAdapter = new MongoDBDatabaseAdapter(
    databaseClient,
    databaseName
  );
  await elizaMongodbAdapter.init();
  const database = databaseClient.db(databaseName);
  initializeExpressApp(elizaMongodbAdapter);
  subscribeToAgentConversation(database);
  const agentConfigurations = await database.collection("agents").find({}).toArray();
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
      config: agentConfiguration.config
    });
    await startAgent(character, elizaMongodbAdapter);
  }
};
initializeAgentsSystem().catch((error) => {
  elizaLogger12.error("Unhandled error in startAgents:", error);
  if (error instanceof Error) {
    console.error(error.stack);
  }
});
export {
  createAgent,
  getTokenForProvider,
  initializeClients,
  initializeDatabaseClient,
  wait2 as wait
};

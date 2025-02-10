import {
  type Action,
  composeContext,
  elizaLogger,
  generateObject,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelClass,
  type State,
} from "@elizaos/core";
import { createCollectionMetadata } from "../handlers/createCollection.ts";
import { CreateCollectionSchema } from "../types/index.ts";
import { createCollectionTemplate } from "../templates/index.ts";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { parseAccount, SuiNetwork } from "../utils/utils.ts";

import {
  generateMoveContract,
  compileMoveContract,
  publishMoveContract,
  createCollection,
} from "../utils/generateMoveContractCode.ts";

export class NFTCollectionAction {
  private suiClient: SuiClient;

  constructor(private runtime: IAgentRuntime) {
    // Initialize Sui client with testnet
    this.suiClient = new SuiClient({
      url: getFullnodeUrl("testnet"),
    });
  }

  async generateCollection(name: string, description: string) {
    // Generate contract name from collection name
    const contractName = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    const symbol = name.slice(0, 5).toUpperCase();
    const maxSupply = 5000;

    // Generate Move contract
    const contractConfig = {
      packageName: contractName,
      name: name,
      symbol: symbol,
      description: description,
      maxSupply: maxSupply,
    };

    // Generate and compile contract
    const { packagePath } = await generateMoveContract(contractConfig);
    const compileResult = await compileMoveContract(packagePath);

    if (!compileResult.compiled) {
      throw new Error(`Contract compilation failed: ${compileResult.error}`);
    }

    elizaLogger.log("Contract compiled successfully");

    // Publish contract
    const publishResult = await publishMoveContract(packagePath);

    if (!publishResult.success || !publishResult.packageId) {
      throw new Error(`Contract deployment failed: ${publishResult.error}`);
    }

    elizaLogger.log(
      `Contract published with package ID: ${publishResult.packageId}`
    );

    // Create collection using the published contract
    const createCollectionResult = await createCollection({
      packageId: publishResult.packageId,
      name: name,
      symbol: symbol,
      description: description,
      maxSupply: maxSupply,
    });

    if (!createCollectionResult.success) {
      throw new Error(
        `Collection creation failed: ${createCollectionResult.error}`
      );
    }

    return {
      packageId: publishResult.packageId,
      collectionId: createCollectionResult.collectionId,
      collectionCap: createCollectionResult.collectionCap,
    };
  }
}

const nftCollectionGeneration: Action = {
  name: "GENERATE_COLLECTION",
  similes: [
    "COLLECTION_GENERATION",
    "COLLECTION_GEN",
    "CREATE_COLLECTION",
    "MAKE_COLLECTION",
    "GENERATE_COLLECTION",
  ],
  description: "Generate an NFT collection on Sui",
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    // Ensure we have the required Sui private key
    return !!runtime.getSetting("SUI_PRIVATE_KEY");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: { [key: string]: unknown },
    callback: HandlerCallback
  ) => {
    try {
      // Ensure we're on testnet
      if (runtime.getSetting("SUI_NETWORK") !== "testnet") {
        throw new Error(
          "Collection generation is only supported on Sui testnet"
        );
      }

      elizaLogger.log("Composing state for message:", message);
      const state = await runtime.composeState(message);

      // Compose collection context
      const context = composeContext({
        state,
        template: createCollectionTemplate,
      });

      const res = await generateObject({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
        schema: CreateCollectionSchema,
      });

      const content = res.object as {
        name: string;
        description: string;
      };

      const action = new NFTCollectionAction(runtime);
      const result = await action.generateCollection(
        content.name,
        content.description
      );

      if (callback) {
        callback({
          text:
            `Collection created successfully! 🎉\n` +
            `Package ID: ${result.packageId}\n` +
            `Collection ID: ${result.collectionId}\n` +
            `Collection Cap: ${result.collectionCap}\n` +
            `View on Explorer: https://suiexplorer.com/object/${result.collectionId}?network=testnet`,
          attachments: [],
        });
      }

      return [];
    } catch (e: any) {
      elizaLogger.error("Error generating collection:", e);
      throw e;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Generate a collection on Sui" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's your new NFT collection on Sui.",
          action: "GENERATE_COLLECTION",
        },
      },
    ],
  ],
} as Action;

export default nftCollectionGeneration;

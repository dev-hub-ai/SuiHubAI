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
import { mintNFTTemplate } from "../templates/index.ts";
import { type MintNFTContent, MintNFTSchema } from "../types/index.ts";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { parseAccount, SuiNetwork } from "../utils/utils.ts";
import { mintNFT } from "../utils/generateMoveContractCode.ts";

function isMintNFTContent(content: any): content is MintNFTContent {
  return (
    typeof content.collectionId === "string" &&
    typeof content.collectionCap === "string" &&
    typeof content.packageId === "string"
  );
}

export class MintNFTAction {
  private suiClient: SuiClient;

  constructor(private runtime: IAgentRuntime) {
    if (!runtime.getSetting("SUI_PRIVATE_KEY")) {
      throw new Error("Sui private key not found");
    }
    this.suiClient = new SuiClient({
      url: getFullnodeUrl("testnet"),
    });
  }

  async mintNFT(content: MintNFTContent, tokenId: number) {
    if (!isMintNFTContent(content)) {
      throw new Error("Invalid content for MINT_NFT action");
    }

    // Mint NFT using the Move contract
    const result = await mintNFT(content.packageId as string, {
      collectionId: content.collectionId as string,
      collectionCap: content.collectionCap as string,
      name: `${content.name || "NFT"} #${tokenId}`,
      description: (content.description as string) || `NFT #${tokenId}`,
      url: (content.imageUrl as string) || "",
    });

    if (!result.success || !result.nftId) {
      throw new Error(result.error || "Failed to mint NFT");
    }

    return {
      nftId: result.nftId,
      transactionId: result.transactionId,
    };
  }
}

const mintNFTAction: Action = {
  name: "MINT_NFT",
  similes: [
    "NFT_MINTING",
    "NFT_CREATION",
    "CREATE_NFT",
    "GENERATE_NFT",
    "MINT_TOKEN",
    "CREATE_TOKEN",
    "MAKE_NFT",
    "TOKEN_GENERATION",
  ],
  description: "Mint NFTs for the collection on Sui",
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    // Ensure we have the required Sui private key
    return !!runtime.getSetting("SUI_PRIVATE_KEY");
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback: HandlerCallback
  ) => {
    try {
      // Ensure we're on testnet
      if (runtime.getSetting("SUI_NETWORK") !== "testnet") {
        throw new Error("NFT minting is only supported on Sui testnet");
      }

      elizaLogger.log("Composing state for message:", message);

      let currentState: State;
      if (!state) {
        currentState = (await runtime.composeState(message)) as State;
      } else {
        currentState = await runtime.updateRecentMessageState(state);
      }

      const context = composeContext({
        state: currentState,
        template: mintNFTTemplate,
      });

      const res = await generateObject({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
        schema: MintNFTSchema,
      });

      const content = res.object as MintNFTContent;
      elizaLogger.log("Generate Object:", content);

      const action = new MintNFTAction(runtime);
      const tokenId = Math.floor(Math.random() * 1000000);
      const result = await action.mintNFT(content, tokenId);

      if (callback) {
        callback({
          text: `NFT minted successfully! 🎉\nNFT ID: ${result.nftId}\nView on Explorer: https://suiexplorer.com/object/${result.nftId}?network=testnet`,
          attachments: [],
        });
      }

      return true;
    } catch (e: unknown) {
      elizaLogger.error("Error minting NFT:", e);
      throw e;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "mint nft for collection: 0x1234... on Sui",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I've minted a new NFT in your specified collection on Sui.",
          action: "MINT_NFT",
        },
      },
    ],
  ],
} as Action;

export default mintNFTAction;

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
import { TransactionBlock } from "@mysten/sui.js";
import { initSuiProvider } from "../providers/wallet.ts";

function isMintNFTContent(content: any): content is MintNFTContent {
  return typeof content.collectionAddress === "string";
}

export class MintNFTAction {
  private suiProvider;

  constructor(private runtime: IAgentRuntime) {
    this.suiProvider = initSuiProvider(runtime);
  }

  async mintNFT(content: MintNFTContent) {
    if (!isMintNFTContent(content)) {
      throw new Error("Invalid content for MINT_NFT action");
    }

    // Create transaction block
    const tx = new TransactionBlock();

    // Call mint function on the collection
    tx.moveCall({
      target: `${content.collectionAddress}::mint`,
      arguments: [tx.pure(this.suiProvider.getAddress())],
    });

    // Execute transaction
    const result = await this.suiProvider.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });

    if (!result.digest) {
      throw new Error("Transaction failed");
    }

    return {
      digest: result.digest,
      collectionAddress: content.collectionAddress,
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
      const result = await action.mintNFT(content);

      if (callback) {
        callback({
          text: `NFT minted successfully! 🎉\nCollection Address: ${result.collectionAddress}\nTransaction: https://suiexplorer.com/txblock/${result.digest}`,
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

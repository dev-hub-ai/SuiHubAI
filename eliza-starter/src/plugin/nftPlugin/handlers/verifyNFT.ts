import type { IAgentRuntime } from "@elizaos/core";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import {
  getNFTInfo,
  getTransactionInfo,
} from "../utils/generateMoveContractCode";
import { SuiNetwork } from "../utils/utils";

export async function verifyNFT({
  runtime,
  collectionId,
  nftId,
}: {
  runtime: IAgentRuntime;
  collectionId: string;
  nftId: string;
}) {
  try {
    // Ensure we're on testnet
    if (runtime.getSetting("SUI_NETWORK") !== "testnet") {
      throw new Error("NFT verification is only supported on Sui testnet");
    }

    const suiClient = new SuiClient({
      url: getFullnodeUrl(runtime.getSetting("SUI_NETWORK") as SuiNetwork),
    });

    // Get NFT object information
    const nftInfo = await getNFTInfo(nftId);

    // Verify the NFT exists and belongs to the correct collection
    if (!nftInfo || !nftInfo.data) {
      return {
        success: false,
        error: "NFT not found",
        verified: false,
      };
    }

    // Check if the NFT belongs to the specified collection
    const nftData = nftInfo.data;
    const nftCollectionId = nftData.collection;

    if (nftCollectionId !== collectionId) {
      return {
        success: false,
        error: "NFT does not belong to the specified collection",
        verified: false,
      };
    }

    return {
      success: true,
      owner: nftData.owner,
      collectionId: nftCollectionId,
      nftData: {
        name: nftData.name,
        description: nftData.description,
        url: nftData.url,
      },
      verified: true,
    };
  } catch (error) {
    console.error("Error verifying NFT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify NFT",
      verified: false,
    };
  }
}

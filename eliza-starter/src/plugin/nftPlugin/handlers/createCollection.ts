import type { AwsS3Service } from "@elizaos/plugin-node";
import {
  composeContext,
  elizaLogger,
  generateImage,
  getEmbeddingZeroVector,
  type IAgentRuntime,
  type Memory,
  ServiceType,
  stringToUuid,
} from "@elizaos/core";
import {
  saveBase64Image,
  saveHeuristImage,
} from "@elizaos/plugin-image-generation";
import {
  generateMoveContract,
  compileMoveContract,
  publishMoveContract,
  createCollection as createSuiCollection,
} from "../utils/generateMoveContractCode.ts";
import { parseAccount } from "../utils/utils.ts";
import { collectionImageTemplate } from "../templates/index.ts";

export async function createCollectionMetadata({
  runtime,
  collectionName,
  fee,
}: {
  runtime: IAgentRuntime;
  collectionName: string;
  fee?: number;
}) {
  const userId = runtime.agentId;
  elizaLogger.log("User ID:", userId);
  const awsS3Service: AwsS3Service = runtime.getService(ServiceType.AWS_S3);
  const agentName = runtime.character.name;
  const roomId = stringToUuid(`nft_generate_room-${agentName}`);

  // Create memory for the message
  const memory: Memory = {
    agentId: userId,
    userId,
    roomId,
    content: {
      text: "",
      source: "nft-generator",
    },
    createdAt: Date.now(),
    embedding: getEmbeddingZeroVector(),
  };
  const state = await runtime.composeState(memory, {
    collectionName,
  });

  const prompt = composeContext({
    state,
    template: collectionImageTemplate,
  });

  const images = await generateImage(
    {
      prompt,
      width: 300,
      height: 300,
    },
    runtime
  );

  if (images.success && images.data && images.data.length > 0) {
    const image = images.data[0];
    const filename = "collection-image";
    const filepath = image.startsWith("http")
      ? await saveHeuristImage(image, filename)
      : saveBase64Image(image, filename);

    const logoPath = await awsS3Service.uploadFile(
      filepath,
      `/${collectionName}`,
      false
    );

    const jsonFilePath = await awsS3Service.uploadJson(
      {
        name: collectionName,
        description: `${collectionName} Collection`,
        image: logoPath.url,
      },
      "metadata.json",
      `${collectionName}`
    );

    return {
      name: collectionName,
      symbol: collectionName.slice(0, 5).toUpperCase(),
      description: `${collectionName} Collection`,
      uri: jsonFilePath.url,
      maxSupply: 1000,
      fee: fee || 0,
    };
  }

  return null;
}

export const createCollection = async (
  runtime: IAgentRuntime,
  collectionName: string,
  fee?: number
) => {
  try {
    // Ensure we're using testnet
    if (runtime.getSetting("SUI_NETWORK") !== "testnet") {
      throw new Error("Collection creation is only supported on Sui testnet");
    }

    const collectionInfo = await createCollectionMetadata({
      runtime,
      collectionName,
      fee,
    });

    if (!collectionInfo) return null;

    // Generate and compile Move contract
    const contractConfig = {
      packageName: collectionName.toLowerCase().replace(/\s+/g, "_"),
      name: collectionInfo.name,
      symbol: collectionInfo.symbol,
      description: collectionInfo.description,
      maxSupply: collectionInfo.maxSupply,
      network: "testnet",
    };

    // Generate contract
    const { packagePath } = await generateMoveContract(contractConfig);

    // Compile contract
    const compileResult = await compileMoveContract(packagePath);
    if (!compileResult.compiled) {
      throw new Error(`Failed to compile contract: ${compileResult.error}`);
    }

    // Publish contract
    const publishResult = await publishMoveContract(packagePath);
    if (!publishResult.success || !publishResult.packageId) {
      throw new Error(`Failed to publish contract: ${publishResult.error}`);
    }

    // Create collection using the published contract
    const createCollectionResult = await createSuiCollection({
      packageId: publishResult.packageId,
      name: collectionInfo.name,
      symbol: collectionInfo.symbol,
      description: collectionInfo.description || "",
      maxSupply: collectionInfo.maxSupply,
    });

    if (!createCollectionResult.success) {
      throw new Error(
        `Failed to create collection: ${createCollectionResult.error}`
      );
    }

    return {
      network: "sui:testnet",
      packageId: publishResult.packageId,
      collectionId: createCollectionResult.collectionId,
      collectionCap: createCollectionResult.collectionCap,
      link: `https://suiexplorer.com/object/${createCollectionResult.collectionId}?network=testnet`,
      collectionInfo,
    };
  } catch (error) {
    elizaLogger.error("Error creating collection:", error);
    throw error;
  }
};

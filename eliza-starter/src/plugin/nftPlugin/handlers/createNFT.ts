import type { AwsS3Service } from "@elizaos/plugin-node";
import {
  composeContext,
  elizaLogger,
  generateImage,
  generateText,
  getEmbeddingZeroVector,
  type IAgentRuntime,
  type Memory,
  ModelClass,
  ServiceType,
  stringToUuid,
} from "@elizaos/core";
import {
  saveBase64Image,
  saveHeuristImage,
} from "@elizaos/plugin-image-generation";
import { mintNFT } from "../utils/generateMoveContractCode";

const nftTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{characterPostExamples}}

{{postDirections}}
# Task: Generate an image to Prompt the {{agentName}}'s appearance, with the total character count MUST be less than 280.
`;

export async function createNFTMetadata({
  runtime,
  collectionName,
  tokenId,
}: {
  runtime: IAgentRuntime;
  collectionName: string;
  tokenId: number;
}) {
  const userId = runtime.agentId;
  elizaLogger.log("User ID:", userId);
  const awsS3Service: AwsS3Service = runtime.getService(ServiceType.AWS_S3);
  const agentName = runtime.character.name;
  const roomId = stringToUuid("nft_generate_room-" + agentName);

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

  const context = composeContext({
    state,
    template: nftTemplate,
  });

  let nftPrompt = await generateText({
    runtime,
    context,
    modelClass: ModelClass.MEDIUM,
  });

  nftPrompt += runtime.character?.nft?.prompt || "";
  nftPrompt += "The image should only feature one person.";

  const images = await generateImage(
    {
      prompt: nftPrompt,
      width: 1024,
      height: 1024,
    },
    runtime
  );

  elizaLogger.log("NFT Prompt:", nftPrompt);

  if (images.success && images.data && images.data.length > 0) {
    const image = images.data[0];
    const filename = `${tokenId}`;

    const filepath = image.startsWith("http")
      ? await saveHeuristImage(image, filename)
      : saveBase64Image(image, filename);

    const nftImage = await awsS3Service.uploadFile(
      filepath,
      `/${collectionName}/items/${tokenId}`,
      false
    );

    const metadata = {
      name: `${collectionName} #${tokenId}`,
      description: `${collectionName} #${tokenId}`,
      image: nftImage.url,
    };

    const jsonFilePath = await awsS3Service.uploadJson(
      metadata,
      "metadata.json",
      `/${collectionName}/items/${tokenId}`
    );

    return {
      ...metadata,
      uri: jsonFilePath.url,
    };
  }
  return null;
}

export async function createNFT({
  runtime,
  packageId,
  collectionId,
  collectionCap,
  tokenId,
}: {
  runtime: IAgentRuntime;
  packageId: string;
  collectionId: string;
  collectionCap: string;
  tokenId: number;
}) {
  // Ensure we're on testnet
  if (runtime.getSetting("SUI_NETWORK") !== "testnet") {
    throw new Error("NFT creation is only supported on Sui testnet");
  }

  const nftMetadata = await createNFTMetadata({
    runtime,
    collectionName: collectionId,
    tokenId,
  });

  if (nftMetadata) {
    const mintResult = await mintNFT(packageId, {
      collectionId,
      collectionCap,
      name: nftMetadata.name,
      description: nftMetadata.description,
      url: nftMetadata.uri,
    });

    if (mintResult.success) {
      return {
        network: "sui:testnet",
        packageId,
        collectionId,
        nftId: mintResult.nftId,
        link: `https://suiexplorer.com/object/${mintResult.nftId}?network=testnet`,
        metadata: nftMetadata,
        transactionId: mintResult.transactionId,
      };
    }
  }
  return null;
}

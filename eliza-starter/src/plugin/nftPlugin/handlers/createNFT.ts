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
import { ethers } from "ethers";
import {
  WalletProvider,
  initWalletProvider,
} from "../../baseSepPlugin/providers/wallet";
import { baseSepolia } from "viem/chains";

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
# Task: Generate an image to Prompt the  {{agentName}}'s appearance, with the total character count MUST be less than 280.
`;

export async function createNFTMetadata({
  runtime,
  collectionName,
  collectionAdminPublicKey,
  collectionFee,
  tokenId,
}: {
  runtime: IAgentRuntime;
  collectionName: string;
  collectionAdminPublicKey: string;
  collectionFee: number;
  tokenId: number;
}) {
  const userId = runtime.agentId;
  elizaLogger.log("User ID:", userId);
  const awsS3Service: AwsS3Service = runtime.getService(ServiceType.AWS_S3);
  const agentName = runtime.character.name;
  const roomId = stringToUuid("nft_generate_room-" + agentName);
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
    if (image.startsWith("http")) {
      elizaLogger.log("Generating image url:", image);
    }
    // Choose save function based on image data format
    const filepath = image.startsWith("http")
      ? await saveHeuristImage(image, filename)
      : saveBase64Image(image, filename);
    const nftImage = await awsS3Service.uploadFile(
      filepath,
      `/${collectionName}/items/${tokenId}`,
      false
    );
    const nftInfo = {
      name: `${collectionName} #${tokenId}`,
      description: `${collectionName} #${tokenId}`,
      symbol: `#${tokenId}`,
      adminPublicKey: collectionAdminPublicKey,
      fee: collectionFee,
      uri: "",
    };
    const jsonFilePath = await awsS3Service.uploadJson(
      {
        name: nftInfo.name,
        description: nftInfo.description,
        image: nftImage.url,
      },
      "metadata.json",
      `/${collectionName}/items/${tokenId}`
    );

    nftInfo.uri = jsonFilePath.url;
    return {
      ...nftInfo,
      imageUri: nftImage.url,
    };
  }
  return null;
}

export async function createNFT({
  runtime,
  collectionName,
  collectionAddress,
  collectionAdminPublicKey,
  collectionFee,
  tokenId,
}: {
  runtime: IAgentRuntime;
  collectionName: string;
  collectionAddress: string;
  collectionAdminPublicKey: string;
  collectionFee: number;
  tokenId: number;
}) {
  const nftInfo = await createNFTMetadata({
    runtime,
    collectionName,
    collectionAdminPublicKey,
    collectionFee,
    tokenId,
  });

  if (nftInfo) {
    // Initialize the wallet provider instead of using BaseSepoliaWallet
    const walletProvider = await initWalletProvider(runtime);

    // Make sure we're on Base Sepolia
    walletProvider.switchChain("baseSepolia");

    const walletClient = walletProvider.getWalletClient("baseSepolia");

    // Mint the NFT using the wallet client
    const nftAddressRes = await walletClient.writeContract({
      address: collectionAddress as `0x${string}`,
      abi: [
        {
          name: "mint",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "name", type: "string" },
            { name: "uri", type: "string" },
            { name: "symbol", type: "string" },
            { name: "adminPublicKey", type: "string" },
            { name: "fee", type: "uint256" },
          ],
          outputs: [],
        },
      ],
      functionName: "mint",
      args: [
        nftInfo.name,
        nftInfo.uri,
        nftInfo.symbol,
        nftInfo.adminPublicKey,
        BigInt(nftInfo.fee),
      ],
      chain: baseSepolia,
      account: walletProvider.getAddress(),
    });

    elizaLogger.log("NFT ID:", tokenId);
    return {
      network: "base-sepolia",
      address: collectionAddress,
      link: `https://sepolia.basescan.org/token/${collectionAddress}`,
      nftInfo,
    };
  }
  return;
}

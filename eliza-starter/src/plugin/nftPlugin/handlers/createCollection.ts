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
  generateERC721ContractCode,
  compileContract,
  deployContract,
} from "../utils/deployEVMContract.ts";
import { initWalletProvider } from "../../baseSepPlugin/providers/wallet.ts";
import { collectionImageTemplate } from "../../baseSepPlugin/templates/index.ts";

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
    const collectionInfo = await createCollectionMetadata({
      runtime,
      collectionName,
      fee,
    });

    if (!collectionInfo) return null;

    // Initialize wallet provider for Base Sepolia
    const walletProvider = await initWalletProvider(runtime);
    const walletClient = walletProvider.getWalletClient("baseSepolia");
    const publicClient = walletProvider.getPublicClient("baseSepolia");

    // Generate and compile the ERC721 contract
    const contractCode = generateERC721ContractCode(collectionName);
    const { abi, bytecode } = await compileContract(
      collectionName,
      contractCode
    );

    // Deploy the contract
    const contractAddress = await deployContract({
      walletClient,
      publicClient,
      abi,
      bytecode,
      args: [
        collectionInfo.name,
        collectionInfo.symbol,
        collectionInfo.maxSupply,
        collectionInfo.fee,
      ],
    });

    return {
      network: "baseSepolia",
      address: contractAddress,
      link: `https://sepolia.basescan.org/address/${contractAddress}`,
      collectionInfo,
    };
  } catch (error) {
    // ... existing error handling ...
  }
};

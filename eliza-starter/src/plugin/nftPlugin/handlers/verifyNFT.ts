import type { IAgentRuntime } from "@elizaos/core";
import { WalletProvider } from "../../baseSepPlugin/providers/wallet";

export async function verifyNFT({
  runtime,
  collectionAddress,
  NFTAddress,
}: {
  runtime: IAgentRuntime;
  collectionAddress: string;
  NFTAddress: string;
}) {
  const privateKey = runtime.getSetting("EVM_PRIVATE_KEY") as `0x${string}`;
  if (!privateKey) {
    throw new Error("EVM_PRIVATE_KEY is missing");
  }

  const wallet = new WalletProvider(privateKey, runtime.cacheManager);
  const publicClient = wallet.getPublicClient("baseSepolia");

  // ERC721 interface for ownerOf and token collection verification
  const erc721Abi = [
    {
      inputs: [{ name: "tokenId", type: "uint256" }],
      name: "ownerOf",
      outputs: [{ name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

  try {
    // Get the owner of the NFT
    const owner = await publicClient.readContract({
      address: collectionAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: "ownerOf",
      args: [BigInt(NFTAddress)],
    });

    // Get the collection name for verification
    const collectionName = await publicClient.readContract({
      address: collectionAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: "name",
    });

    return {
      success: true,
      owner,
      collectionName,
      verified: true,
    };
  } catch (error) {
    console.error("Error verifying NFT:", error);
    return {
      success: false,
      error: "Failed to verify NFT ownership or collection",
      verified: false,
    };
  }
}

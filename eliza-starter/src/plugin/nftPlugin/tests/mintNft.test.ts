import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MintNFTAction } from "../actions/mintNft.ts";
import { SuiClient } from "@mysten/sui/client";

// Mock the IAgentRuntime
const mockRuntime = {
  getSetting: vi.fn((key: string) => {
    if (key === "SUI_PRIVATE_KEY") {
      return "mock_private_key";
    }
    if (key === "SUI_NETWORK") {
      return "testnet";
    }
    return null;
  }),
};

// Mock Sui client
vi.mock("@mysten/sui/client", () => ({
  SuiClient: vi.fn().mockImplementation(() => ({
    // Add mock methods as needed
  })),
  getFullnodeUrl: vi.fn().mockReturnValue("https://testnet.sui.io"),
}));

// Mock generateMoveContractCode utilities
vi.mock("../utils/generateMoveContractCode", () => ({
  mintNFT: vi.fn().mockResolvedValue({
    success: true,
    nftId: "0xmockedNFTId",
    transactionId: "0xmockedTransactionId",
  }),
}));

describe("MintNFT Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Constructor", () => {
    it("should initialize with runtime", () => {
      const action = new MintNFTAction(mockRuntime as any);
      expect(action).toBeDefined();
    });

    it("should throw if Sui private key is not found", () => {
      const runtimeWithoutKey = {
        getSetting: vi.fn().mockReturnValue(null),
      };

      expect(() => new MintNFTAction(runtimeWithoutKey as any)).toThrow(
        "Sui private key not found"
      );
    });
  });

  describe("mintNFT", () => {
    let action: MintNFTAction;

    beforeEach(() => {
      action = new MintNFTAction(mockRuntime as any);
    });

    it("should successfully mint an NFT", async () => {
      const content = {
        packageId: "0xmockedPackageId",
        collectionId: "0xmockedCollectionId",
        collectionCap: "0xmockedCollectionCap",
        name: "Test NFT",
        description: "Test Description",
        imageUrl: "https://example.com/image.png",
        collectionAddress: "0xmockedCollectionAddress",
        text: "Test NFT Description",
      };

      const result = await action.mintNFT(content, 1);

      expect(result).toEqual({
        nftId: "0xmockedNFTId",
        transactionId: "0xmockedTransactionId",
      });
    });

    it("should throw on invalid content", async () => {
      const invalidContent = {
        name: "Test NFT",
      };

      await expect(action.mintNFT(invalidContent as any, 1)).rejects.toThrow(
        "Invalid content for MINT_NFT action"
      );
    });
  });
});

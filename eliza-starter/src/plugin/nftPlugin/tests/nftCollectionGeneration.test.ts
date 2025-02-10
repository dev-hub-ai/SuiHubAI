import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NFTCollectionAction } from "../actions/nftCollectionGeneration";
import { SuiClient } from "@mysten/sui/client";
import {
  generateMoveContract,
  compileMoveContract,
  publishMoveContract,
  createCollection,
} from "../utils/generateMoveContractCode";

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
  SuiClient: vi.fn().mockImplementation(() => ({})),
  getFullnodeUrl: vi.fn().mockReturnValue("https://testnet.sui.io"),
}));

// Mock generateMoveContractCode utilities
vi.mock("../utils/generateMoveContractCode", () => ({
  generateMoveContract: vi.fn().mockResolvedValue({
    packagePath: "/mock/path",
  }),
  compileMoveContract: vi.fn().mockResolvedValue({
    compiled: true,
  }),
  publishMoveContract: vi.fn().mockResolvedValue({
    success: true,
    packageId: "0xmockedPackageId",
  }),
  createCollection: vi.fn().mockResolvedValue({
    success: true,
    collectionId: "0xmockedCollectionId",
    collectionCap: "0xmockedCollectionCap",
  }),
}));

describe("NFTCollection Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Constructor", () => {
    it("should initialize with runtime", () => {
      const action = new NFTCollectionAction(mockRuntime as any);
      expect(action).toBeDefined();
    });
  });

  describe("generateCollection", () => {
    let action: NFTCollectionAction;

    beforeEach(() => {
      action = new NFTCollectionAction(mockRuntime as any);
    });

    it("should successfully generate a collection", async () => {
      const result = await action.generateCollection(
        "Test Collection",
        "Test Description"
      );

      expect(result).toEqual({
        packageId: "0xmockedPackageId",
        collectionId: "0xmockedCollectionId",
        collectionCap: "0xmockedCollectionCap",
      });
    });

    it("should handle contract compilation failure", async () => {
      vi.mocked(compileMoveContract).mockResolvedValueOnce({
        compiled: false,
        error: "Compilation failed",
      });

      await expect(
        action.generateCollection("Test Collection", "Test Description")
      ).rejects.toThrow("Contract compilation failed: Compilation failed");
    });

    it("should handle contract deployment failure", async () => {
      vi.mocked(publishMoveContract).mockResolvedValueOnce({
        success: false,
        error: "Deployment failed",
      });

      await expect(
        action.generateCollection("Test Collection", "Test Description")
      ).rejects.toThrow("Contract deployment failed: Deployment failed");
    });

    it("should handle collection creation failure", async () => {
      vi.mocked(createCollection).mockResolvedValueOnce({
        success: false,
        error: "Creation failed",
      });

      await expect(
        action.generateCollection("Test Collection", "Test Description")
      ).rejects.toThrow("Collection creation failed: Creation failed");
    });
  });
});

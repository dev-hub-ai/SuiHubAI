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
import { createCollectionMetadata } from "../handlers/createCollection.ts";
import { CreateCollectionSchema } from "../types/index.ts";
import { createCollectionTemplate } from "../templates/index.ts";
import * as viemChains from "viem/chains";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  compileContract,
  deployContract,
  encodeConstructorArguments,
  generateERC721ContractCode,
} from "../utils/deployEVMContract.ts";

export class NFTCollectionAction {
  private publicClient;
  private walletClient;
  private account;

  constructor(
    private runtime: IAgentRuntime,
    private chain: (typeof viemChains)[keyof typeof viemChains]
  ) {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY") as `0x${string}`;
    if (!privateKey) throw new Error("EVM private key not found");

    const provider = http(chain.rpcUrls.default.http[0]);
    this.account = privateKeyToAccount(privateKey);

    this.walletClient = createWalletClient({
      account: this.account,
      chain,
      transport: provider,
    });

    this.publicClient = createPublicClient({
      chain,
      transport: provider,
    });
  }

  async generateCollection() {
    const contractName = this.runtime.character.name.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    const contractSymbol = `${contractName.toUpperCase()[0]}`;
    const contractMaxSupply = 5000;
    const royalty = 0;
    const params = [contractName, contractSymbol, contractMaxSupply, royalty];

    const sourceCode = generateERC721ContractCode(contractName);
    const compiledContract = await compileContract(contractName, sourceCode);

    if (
      !compiledContract ||
      !compiledContract.abi ||
      !compiledContract.bytecode
    ) {
      throw new Error("Contract compilation failed or produced invalid output");
    }

    const { abi, bytecode } = compiledContract;
    elizaLogger.log("Contract compiled successfully");

    const contractAddress = await deployContract({
      walletClient: this.walletClient,
      publicClient: this.publicClient,
      abi,
      bytecode,
      args: params,
    });

    if (!contractAddress) {
      throw new Error("Contract deployment failed");
    }

    elizaLogger.log(`Contract deployed at: ${contractAddress}`);
    return contractAddress;
  }
}

const nftCollectionGeneration: Action = {
  name: "GENERATE_COLLECTION",
  similes: [
    "COLLECTION_GENERATION",
    "COLLECTION_GEN",
    "CREATE_COLLECTION",
    "MAKE_COLLECTION",
    "GENERATE_COLLECTION",
  ],
  description: "Generate an NFT collection for the message",
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    const evmPrivateKeyOk = !!runtime.getSetting("EVM_PRIVATE_KEY");
    return evmPrivateKeyOk;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: { [key: string]: unknown },
    callback: HandlerCallback
  ) => {
    try {
      elizaLogger.log("Composing state for message:", message);
      const state = await runtime.composeState(message);

      // Compose transfer context
      const context = composeContext({
        state,
        template: createCollectionTemplate,
      });

      // Get list of supported chains from viem
      const chains = viemChains;
      const _SupportedChainList = Object.keys(viemChains) as Array<
        keyof typeof viemChains
      >;
      const supportedChains = _SupportedChainList as unknown as [
        string,
        ...string[]
      ];

      // Add chains to context
      const contextWithChains = context.replace(
        "SUPPORTED_CHAINS",
        supportedChains.map((item) => (item ? `"${item}"` : item)).join("|")
      );

      const res = await generateObject({
        runtime,
        context: contextWithChains,
        modelClass: ModelClass.LARGE,
        schema: CreateCollectionSchema,
      });

      const content = res.object as {
        chainName: (typeof supportedChains)[number];
      };

      const chain = viemChains[content.chainName];
      const action = new NFTCollectionAction(runtime, chain);

      const contractAddress = await action.generateCollection();

      if (callback) {
        callback({
          text: `Collection created successfully! 🎉\nView on ${chain.name}: ${chain.blockExplorers.default.url}/address/${contractAddress}\nContract Address: ${contractAddress}`,
          attachments: [],
        });
      }

      return [];
    } catch (e: any) {
      elizaLogger.error("Error generating collection:", e);
      throw e;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Generate a collection on Ethereum" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here's the collection you requested.",
          action: "GENERATE_COLLECTION",
        },
      },
    ],
    // ... Add more examples for EVM chains ...
  ],
} as Action;

export default nftCollectionGeneration;

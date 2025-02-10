import {
  Ed25519Keypair,
  Connection,
  SuiClient,
  RawSigner,
} from "@mysten/sui.js";
import type { IAgentRuntime } from "@elizaos/core";

export class SuiProvider {
  private signer: RawSigner;
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private static readonly TESTNET_RPC = "https://fullnode.testnet.sui.io";
  private static readonly TESTNET_FAUCET = "https://faucet.testnet.sui.io/gas";

  constructor(privateKey: string | Ed25519Keypair) {
    // Initialize keypair
    this.keypair =
      typeof privateKey === "string"
        ? Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, "hex"))
        : privateKey;

    // Initialize provider and signer for testnet
    const connection = new Connection({
      fullnode: SuiProvider.TESTNET_RPC,
      faucet: SuiProvider.TESTNET_FAUCET,
    });

    this.client = new SuiClient({ connection });
    this.signer = new RawSigner(this.keypair, this.client);
  }

  getAddress(): string {
    return this.keypair.getPublicKey().toSuiAddress();
  }

  async getBalance(): Promise<bigint> {
    const balance = await this.client.getBalance({
      owner: this.getAddress(),
    });
    return balance.totalBalance;
  }

  async signAndExecuteTransactionBlock(params: { transactionBlock: any }) {
    return this.signer.signAndExecuteTransactionBlock(params);
  }

  // Helper method to get transaction URL for testnet explorer
  getTransactionUrl(digest: string): string {
    return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
  }

  // Helper method to get address URL for testnet explorer
  getAddressUrl(address: string): string {
    return `https://suiexplorer.com/address/${address}?network=testnet`;
  }
}

export function initSuiProvider(runtime: IAgentRuntime): SuiProvider {
  const privateKey = runtime.getSetting("SUI_PRIVATE_KEY");
  if (!privateKey) {
    throw new Error("SUI_PRIVATE_KEY not found in runtime settings");
  }
  return new SuiProvider(privateKey);
}

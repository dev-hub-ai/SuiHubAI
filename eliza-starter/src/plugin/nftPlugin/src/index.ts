export * from "../actions/mintNft.ts";
export * from "../actions/nftCollectionGeneration.ts";
export * from "../providers/wallet.ts";
export * from "../types/index.ts";

import type { Plugin } from "@elizaos/core";
import nftCollectionGeneration from "../actions/nftCollectionGeneration.ts";
import mintNFTAction from "../actions/mintNft.ts";
import { walletProvider } from "../providers/wallet.ts";

export async function sleep(ms = 3000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
export const nftPlugin: Plugin = {
  name: "nft",
  description: "NFT plugin",
  providers: [walletProvider],
  evaluators: [],
  services: [],
  actions: [nftCollectionGeneration, mintNFTAction],
};

export default nftPlugin;

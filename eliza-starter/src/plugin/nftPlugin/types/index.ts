import { z } from "zod";
import type { Content } from "@elizaos/core";

export interface MintNFTContent extends Content {
  collectionAddress: string;
}

export const MintNFTSchema = z.object({
  collectionAddress: z.string(),
});

export const CreateCollectionSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  description: z.string().optional(),
});

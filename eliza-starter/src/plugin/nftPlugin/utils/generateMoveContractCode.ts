import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "child_process";

// Move.toml template
const MOVE_TOML_TEMPLATE = `[package]
name = "{{packageName}}"
version = "0.0.1"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet", override = true }

[addresses]
nft = "0x0"
`;

// Contract template with proper Sui Move syntax
const CONTRACT_TEMPLATE = `module nft::nft_collection {
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};
    use sui::event;
    use sui::package;
    use std::string::{Self, String};

    /// One-Time-Witness for the module
    struct NFT_COLLECTION has drop {}

    /// Event emitted when a new NFT is minted
    struct NFTMinted has copy, drop {
        object_id: ID,
        creator: address,
        name: String
    }

    /// The Collection capability
    struct CollectionCap has key {
        id: UID,
        collection_id: ID
    }

    /// The Collection object
    struct Collection has key {
        id: UID,
        name: String,
        symbol: String,
        description: String,
        minted: u64,
        max_supply: u64
    }

    /// The NFT object
    struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        url: Url,
        collection: ID
    }

    // ======= Error Constants =======
    const EMaxSupplyReached: u64 = 0;
    const EInvalidCollection: u64 = 1;

    fun init(witness: NFT_COLLECTION, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);
        package::burn_publisher(publisher);
    }

    /// Create a new collection
    public entry fun create_collection(
        name: vector<u8>,
        symbol: vector<u8>,
        description: vector<u8>,
        max_supply: u64,
        ctx: &mut TxContext
    ) {
        let collection = Collection {
            id: object::new(ctx),
            name: string::utf8(name),
            symbol: string::utf8(symbol),
            description: string::utf8(description),
            minted: 0,
            max_supply
        };

        let collection_id = object::id(&collection);
        
        let cap = CollectionCap {
            id: object::new(ctx),
            collection_id
        };

        // Transfer the collection object
        transfer::share_object(collection);
        // Transfer the capability to the creator
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    /// Mint a new NFT
    public entry fun mint_nft(
        _cap: &CollectionCap,
        collection: &mut Collection,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Check max supply
        assert!(collection.minted < collection.max_supply, EMaxSupplyReached);
        
        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url),
            collection: object::id(collection)
        };

        collection.minted = collection.minted + 1;

        // Emit mint event
        event::emit(NFTMinted {
            object_id: object::id(&nft),
            creator: tx_context::sender(ctx),
            name: nft.name
        });

        // Transfer NFT to the caller
        transfer::transfer(nft, tx_context::sender(ctx));
    }

    // ======= View Functions =======
    
    /// Get collection info
    public fun collection_info(collection: &Collection): (String, String, String, u64, u64) {
        (
            collection.name,
            collection.symbol,
            collection.description,
            collection.minted,
            collection.max_supply
        )
    }
}`;

interface MoveContractConfig {
  packageName: string;
  name: string;
  symbol: string;
  description?: string;
  maxSupply: number;
}

export async function generateMoveContract(
  config: MoveContractConfig
): Promise<{
  code: string;
  path: string;
  packagePath: string;
}> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const packageDir = path.join(currentDir, "../contract", config.packageName);

  // Ensure package directory exists
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }

  // Create sources directory
  const sourcesDir = path.join(packageDir, "sources");
  if (!fs.existsSync(sourcesDir)) {
    fs.mkdirSync(sourcesDir);
  }

  // Generate Move.toml
  const moveToml = MOVE_TOML_TEMPLATE.replace(
    /{{packageName}}/g,
    config.packageName
  );
  fs.writeFileSync(path.join(packageDir, "Move.toml"), moveToml);

  // Generate contract code
  const contractPath = path.join(sourcesDir, "nft_collection.move");
  const contractCode = CONTRACT_TEMPLATE;

  // Write contract to file
  fs.writeFileSync(contractPath, contractCode);

  return {
    code: contractCode,
    path: contractPath,
    packagePath: packageDir,
  };
}

export async function compileMoveContract(packagePath: string): Promise<{
  compiled: boolean;
  output?: string;
  error?: string;
}> {
  try {
    // Ensure sui CLI is installed
    const suiVersion = execSync("sui --version").toString();
    console.log("Sui version:", suiVersion);

    // Compile the contract
    const output = execSync(`sui move build --path ${packagePath}`, {
      encoding: "utf8",
    });

    return {
      compiled: true,
      output,
    };
  } catch (error) {
    console.error("Error compiling Move contract:", error);
    return {
      compiled: false,
      error: error.message,
    };
  }
}

export async function publishMoveContract(packagePath: string): Promise<{
  success: boolean;
  packageId?: string;
  output?: string;
  error?: string;
}> {
  try {
    const output = execSync(
      `sui client publish ${packagePath} --gas-budget 100000000 --json`,
      {
        encoding: "utf8",
      }
    );

    // Parse JSON output
    const result = JSON.parse(output);

    // Extract package ID from effects
    const effects = result.effects;
    const created = effects?.created || [];
    const packageId = created.find((obj: any) => obj.owner === "Immutable")
      ?.reference?.objectId;

    if (!packageId) {
      return {
        success: false,
        error: "Could not find package ID in transaction output",
        output,
      };
    }

    return {
      success: true,
      packageId,
      output,
    };
  } catch (error) {
    console.error("Error publishing Move contract:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getContractABI(packageId: string): Promise<any> {
  try {
    const output = execSync(`sui client object ${packageId}`, {
      encoding: "utf8",
    });

    // Parse the output to get module interface
    const abiData = JSON.parse(output);
    return abiData;
  } catch (error) {
    console.error("Error getting contract ABI:", error);
    throw error;
  }
}

interface MintNFTParams {
  collectionId: string;
  collectionCap: string;
  name: string;
  description: string;
  url: string;
}

export async function mintNFT(
  packageId: string,
  params: MintNFTParams
): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
  nftId?: string;
}> {
  try {
    // Pre-compute hex values
    const nameHex = Buffer.from(params.name).toString("hex");
    const descriptionHex = Buffer.from(params.description).toString("hex");
    const urlHex = Buffer.from(params.url).toString("hex");

    // Construct command using array join
    const command = [
      "sui client call",
      `--package ${packageId}`,
      "--module nft_collection",
      "--function mint_nft",
      "--args",
      `"${params.collectionCap}"`, // CollectionCap object ID
      `"${params.collectionId}"`, // Collection object ID
      `"0x${nameHex}"`, // NFT name as hex
      `"0x${descriptionHex}"`, // NFT description as hex
      `"0x${urlHex}"`, // NFT URL as hex
      "--gas-budget 100000000",
      "--json",
    ].join(" ");

    console.log("Executing mint command:", command);

    const output = execSync(command, {
      encoding: "utf8",
    });

    // Parse JSON output
    const result = JSON.parse(output);
    console.log("Mint result:", JSON.stringify(result, null, 2));

    // Extract transaction ID and NFT ID from effects
    const txId = result.digest;
    const objectChanges = result.objectChanges || [];

    // Find the newly created NFT object
    const nftObject = objectChanges.find(
      (obj: any) =>
        obj.type === "created" &&
        obj.objectType?.includes("::nft_collection::NFT")
    );

    if (!nftObject) {
      return {
        success: false,
        error: "Could not find NFT object in transaction output",
        transactionId: txId,
      };
    }

    return {
      success: true,
      transactionId: txId,
      nftId: nftObject.objectId,
    };
  } catch (error) {
    console.error("Error minting NFT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getNFTInfo(nftId: string): Promise<any> {
  try {
    const output = execSync(`sui client object ${nftId} --json`, {
      encoding: "utf8",
    });

    const result = JSON.parse(output);

    // Log raw output for debugging
    console.log("Raw NFT Info Output:", output);

    return result;
  } catch (error) {
    console.error("Error getting NFT info:", error);
    if (error instanceof Error) {
      console.error("Raw output:", error.message);
    }
    throw error;
  }
}

export async function getTransactionInfo(transactionId: string): Promise<any> {
  try {
    // Updated command to use tx-block instead of transaction
    const output = execSync(`sui client tx-block ${transactionId} --json`, {
      encoding: "utf8",
    });

    return JSON.parse(output);
  } catch (error) {
    console.error("Error getting transaction info:", error);
    throw error;
  }
}

interface CreateCollectionParams {
  packageId: string;
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
}

interface CreateCollectionResult {
  success: boolean;
  collectionId?: string;
  collectionCap?: string;
  error?: string;
  output?: any;
}

export async function createCollection(
  params: CreateCollectionParams
): Promise<CreateCollectionResult> {
  try {
    // Pre-compute hex values
    const nameHex = Buffer.from(params.name).toString("hex");
    const symbolHex = Buffer.from(params.symbol).toString("hex");
    const descriptionHex = Buffer.from(params.description || "").toString(
      "hex"
    );

    // Construct command using array join
    const command = [
      "sui client call",
      `--package ${params.packageId}`,
      "--module nft_collection",
      "--function create_collection",
      "--args",
      `"0x${nameHex}"`,
      `"0x${symbolHex}"`,
      `"0x${descriptionHex}"`,
      `"${params.maxSupply}"`,
      "--gas-budget 100000000",
      "--json",
    ].join(" ");

    console.log("Executing create collection command:", command);

    const output = execSync(command, {
      encoding: "utf8",
    });

    const result = JSON.parse(output);

    // Extract collection ID and cap from the objectChanges array
    const objectChanges = result.objectChanges || [];

    // Find Collection and CollectionCap objects
    const collectionObject = objectChanges.find((obj: any) =>
      obj.objectType?.includes("::nft_collection::Collection")
    );

    const collectionCapObject = objectChanges.find((obj: any) =>
      obj.objectType?.includes("::nft_collection::CollectionCap")
    );

    if (!collectionObject || !collectionCapObject) {
      return {
        success: false,
        error: "Failed to find Collection or CollectionCap objects",
        output: result,
      };
    }

    const collectionId = collectionObject.objectId;
    const collectionCap = collectionCapObject.objectId;

    if (!collectionId || !collectionCap) {
      return {
        success: false,
        error: "Failed to extract collection ID or capability",
        output: result,
      };
    }

    return {
      success: true,
      collectionId,
      collectionCap,
      output: result,
    };
  } catch (error) {
    console.error("Error creating collection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

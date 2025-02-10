import {
  generateMoveContract,
  compileMoveContract,
  publishMoveContract,
  mintNFT,
  getNFTInfo,
  getTransactionInfo,
  createCollection,
} from "../utils/generateMoveContractCode.ts";

async function testContractDeployment() {
  try {
    console.log("Starting contract deployment test...");

    // 1. Generate contract
    const config = {
      packageName: "test_nft_collection",
      name: "TestNFTCollection",
      symbol: "TNFT",
      description: "Test NFT Collection",
      maxSupply: 1000,
    };

    console.log("Generating contract...");
    const { code, path, packagePath } = await generateMoveContract(config);
    console.log("Contract generated at:", path);
    console.log("Package path:", packagePath);

    // 2. Compile contract
    console.log("\nCompiling contract...");
    const {
      compiled,
      output: compileOutput,
      error: compileError,
    } = await compileMoveContract(packagePath);

    if (!compiled) {
      throw new Error(`Compilation failed: ${compileError}`);
    }
    console.log("Compilation successful!");
    if (compileOutput) console.log("Compile output:", compileOutput);

    // 3. Publish contract
    console.log("\nPublishing contract...");
    const {
      success,
      packageId,
      output: publishOutput,
      error: publishError,
    } = await publishMoveContract(packagePath);

    if (!success || !packageId) {
      throw new Error(
        `Publication failed: ${publishError}\nOutput: ${publishOutput}`
      );
    }

    console.log("Contract published successfully!");
    console.log("Package ID:", packageId);

    // 4. Create collection
    console.log("\nCreating collection...");
    const createCollectionResult = await createCollection({
      packageId,
      name: config.name,
      symbol: config.symbol,
      description: config.description || "",
      maxSupply: config.maxSupply,
    });

    if (!createCollectionResult.success) {
      throw new Error(
        `Failed to create collection: ${createCollectionResult.error}`
      );
    }

    console.log("\nCollection created successfully:");
    console.log("Collection ID:", createCollectionResult.collectionId);
    console.log("Collection Cap:", createCollectionResult.collectionCap);

    // 5. Test minting
    console.log("\nTesting NFT minting...");
    const mintParams = {
      collectionId: createCollectionResult.collectionId!,
      collectionCap: createCollectionResult.collectionCap!,
      name: "Test NFT #1",
      description: "Test NFT",
      url: "https://example.com/nft/1.png",
    };

    console.log("Minting with params:", JSON.stringify(mintParams, null, 2));
    const mintResult = await mintNFT(packageId, mintParams);

    if (!mintResult.success) {
      console.error("Minting failed:", mintResult.error);
      throw new Error(`NFT minting failed: ${mintResult.error}`);
    }

    console.log("NFT minted successfully!");
    console.log("NFT ID:", mintResult.nftId);
    console.log("Transaction ID:", mintResult.transactionId);

    // Get NFT and transaction info
    const nftInfo = await getNFTInfo(mintResult.nftId!);
    console.log("\nNFT Info:", JSON.stringify(nftInfo, null, 2));

    const txInfo = await getTransactionInfo(mintResult.transactionId!);
    console.log("\nTransaction Info:", JSON.stringify(txInfo, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testContractDeployment();

import {
  generateMoveContract,
  compileMoveContract,
  publishMoveContract,
  mintNFT,
  getNFTInfo,
  getTransactionInfo,
} from "./generateMoveContractCode.ts";

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

    if (!success) {
      throw new Error(
        `Publication failed: ${publishError}\nOutput: ${publishOutput}`
      );
    }

    if (!packageId) {
      throw new Error("Publication succeeded but no package ID was returned");
    }

    console.log("Contract published successfully!");
    console.log("Package ID:", packageId);
    console.log("\nFull publication output:", publishOutput);

    // 4. Test minting (uncomment when ready)
    /*
    console.log("\nTesting NFT minting...");
    const mintParams = {
      collectionId: "YOUR_COLLECTION_ID",
      collectionCap: "YOUR_COLLECTION_CAP",
      name: "Test NFT #1",
      description: "My first test NFT",
      url: "https://example.com/nft/1.png"
    };

    const mintResult = await mintNFT(packageId, mintParams);
    if (mintResult.success && mintResult.nftId) {
      console.log("NFT minted successfully!");
      console.log("NFT ID:", mintResult.nftId);
      console.log("Transaction ID:", mintResult.transactionId);

      const nftInfo = await getNFTInfo(mintResult.nftId);
      console.log("\nNFT Info:", JSON.stringify(nftInfo, null, 2));

      const txInfo = await getTransactionInfo(mintResult.transactionId!);
      console.log("\nTransaction Info:", JSON.stringify(txInfo, null, 2));
    } else {
      console.error("Minting failed:", mintResult.error);
    }
    */
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testContractDeployment();

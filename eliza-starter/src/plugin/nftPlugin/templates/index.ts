export const createCollectionTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- chainName to execute on: Must be one of ["sui", "ethereum", "base", ...]

Respond with a JSON markdown block containing only the extracted values. All fields are required:

\`\`\`json
{
    "chainName": SUPPORTED_CHAINS,
    "packageId": null
}
\`\`\`

Note: For Sui chain, include the packageId from the deployment output if available.
`;

export const collectionImageTemplate = `
Generate a logo with the text "{{collectionName}}", using orange as the main color, with a sci-fi and mysterious background theme
`;

export const mintNFTTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "collectionAddress": null,
    "chainName": SUPPORTED_CHAINS,
    "packageId": null
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested mint nft:
- collection contract address (for EVM chains) or packageId (for Sui)
- chain name

Note: For Sui chain, use the packageId from the deployment output. For other chains, use the collection contract address.`;

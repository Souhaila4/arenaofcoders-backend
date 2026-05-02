"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const sdk_1 = require("@hashgraph/sdk");
async function main() {
    const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
    const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
    if (!accountIdStr || !privateKeyStr) {
        throw new Error('HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env');
    }
    const operatorId = sdk_1.AccountId.fromString(accountIdStr);
    const operatorKey = sdk_1.PrivateKey.fromStringECDSA(privateKeyStr);
    const client = sdk_1.Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    console.log(`\n🏗️  Creating Arena Coin on Hedera Testnet...`);
    console.log(`   Treasury: ${accountIdStr}`);
    const tx = await new sdk_1.TokenCreateTransaction()
        .setTokenName('Arena Coin')
        .setTokenSymbol('ARENA')
        .setTokenType(sdk_1.TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(100_000_00)
        .setTreasuryAccountId(operatorId)
        .setAdminKey(operatorKey.publicKey)
        .setSupplyKey(operatorKey.publicKey)
        .setFreezeDefault(false)
        .freezeWith(client)
        .sign(operatorKey);
    const submit = await tx.execute(client);
    const receipt = await submit.getReceipt(client);
    const tokenId = receipt.tokenId.toString();
    client.close();
    console.log(`\n✅ Arena Coin created successfully!`);
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Initial Supply: 100,000 ARENA`);
    console.log(`   Decimals: 2`);
    console.log(`\n👉 Add this to your .env file:`);
    console.log(`   ARENA_COIN_TOKEN_ID=${tokenId}`);
    console.log(`\n🔍 View on HashScan: https://hashscan.io/testnet/token/${tokenId}`);
}
main().catch((err) => {
    console.error('❌ Failed to create token:', err);
    process.exit(1);
});
//# sourceMappingURL=create-arena-coin.js.map
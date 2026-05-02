"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const sdk_1 = require("@hashgraph/sdk");
const client_1 = require("@prisma/client");
let WalletService = WalletService_1 = class WalletService {
    prisma;
    config;
    logger = new common_1.Logger(WalletService_1.name);
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    buildClient() {
        const accountIdStr = this.config.get('HEDERA_ACCOUNT_ID');
        const privateKeyStr = this.config.get('HEDERA_PRIVATE_KEY');
        const operatorId = sdk_1.AccountId.fromString(accountIdStr);
        const operatorKey = sdk_1.PrivateKey.fromStringECDSA(privateKeyStr);
        const client = sdk_1.Client.forTestnet();
        client.setOperator(operatorId, operatorKey);
        return { client, operatorId, operatorKey };
    }
    get arenaTokenId() {
        const id = this.config.get('ARENA_COIN_TOKEN_ID');
        if (!id)
            throw new common_1.InternalServerErrorException('ARENA_COIN_TOKEN_ID is not configured in .env');
        return sdk_1.TokenId.fromString(id);
    }
    toAtomicUnits(amount) {
        return Math.round(amount * 100);
    }
    fromAtomicUnits(atomic) {
        return atomic / 100;
    }
    async adminMintToCompany(userId, amount) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                hederaAccountId: true,
                walletBalance: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.hederaAccountId) {
            throw new common_1.BadRequestException('This user has not registered a Hedera wallet. Ask them to use PATCH /user/wallet first.');
        }
        const tokenIdStr = this.config.get('ARENA_COIN_TOKEN_ID');
        if (!tokenIdStr) {
            throw new common_1.InternalServerErrorException('ARENA_COIN_TOKEN_ID is not configured in .env');
        }
        const { client, operatorId, operatorKey } = this.buildClient();
        const tokenId = this.arenaTokenId;
        const recipientId = sdk_1.AccountId.fromString(user.hederaAccountId);
        const atomicAmount = this.toAtomicUnits(amount);
        let hederaTxId = null;
        let txStatus = client_1.TransactionStatus.SUCCESS;
        let errorNote = null;
        try {
            const mintTx = await new sdk_1.TokenMintTransaction()
                .setTokenId(tokenId)
                .setAmount(atomicAmount)
                .freezeWith(client)
                .sign(operatorKey);
            const mintSubmit = await mintTx.execute(client);
            await mintSubmit.getReceipt(client);
            this.logger.log(`Minted ${amount} ARENA to treasury`);
            const transferTx = await new sdk_1.TransferTransaction()
                .addTokenTransfer(tokenId, operatorId, -atomicAmount)
                .addTokenTransfer(tokenId, recipientId, atomicAmount)
                .freezeWith(client)
                .sign(operatorKey);
            const transferSubmit = await transferTx.execute(client);
            const receipt = await transferSubmit.getReceipt(client);
            hederaTxId = transferSubmit.transactionId.toString();
            this.logger.log(`Transferred ${amount} ARENA → ${user.hederaAccountId} (${String(receipt.status)})`);
        }
        catch (err) {
            client.close();
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
                txStatus = client_1.TransactionStatus.PENDING_ASSOCIATION;
                errorNote = `The company has not associated Arena Coin (${tokenIdStr}) with their wallet yet. Ask them to associate it in HashPack.`;
                this.logger.warn(`[MINT] Token not associated: ${user.hederaAccountId}`);
            }
            else {
                txStatus = client_1.TransactionStatus.FAILED;
                errorNote = msg;
                this.logger.error('[MINT] Transfer failed', msg);
                await this.logTransaction({
                    senderAccountId: 'TREASURY',
                    receiverAccountId: user.hederaAccountId,
                    amount,
                    type: client_1.TransactionType.ADMIN_MINT,
                    status: txStatus,
                    errorNote,
                    hederaTransactionId: hederaTxId ?? undefined,
                });
                throw new common_1.InternalServerErrorException(`Failed to mint coins: ${msg}`);
            }
        }
        client.close();
        const isSuccess = txStatus === client_1.TransactionStatus.SUCCESS;
        if (isSuccess) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { walletBalance: { increment: amount } },
            });
        }
        const log = await this.logTransaction({
            senderAccountId: 'TREASURY',
            receiverAccountId: user.hederaAccountId,
            amount,
            type: client_1.TransactionType.ADMIN_MINT,
            status: txStatus,
            errorNote: errorNote ?? undefined,
            hederaTransactionId: hederaTxId ?? undefined,
        });
        return {
            success: isSuccess,
            userId,
            recipientAccountId: user.hederaAccountId,
            amount,
            newBalance: isSuccess ? user.walletBalance + amount : user.walletBalance,
            transactionLogId: log.id,
            hederaTransactionId: hederaTxId,
            ...(errorNote && { note: errorNote }),
        };
    }
    async lockEscrow(companyUserId, amount, competitionId) {
        if (amount <= 0)
            return;
        const company = await this.prisma.user.findUnique({
            where: { id: companyUserId },
            select: { id: true, walletBalance: true, hederaAccountId: true },
        });
        if (!company)
            throw new common_1.NotFoundException('Company user not found');
        if (company.walletBalance < amount) {
            throw new common_1.BadRequestException(`Insufficient Arena Coin balance. Required: ${amount}, Available: ${company.walletBalance}`);
        }
        const tokenIdStr = this.config.get('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';
        await this.prisma.user.update({
            where: { id: companyUserId },
            data: { walletBalance: { decrement: amount } },
        });
        let hederaTxId = null;
        let txStatus = client_1.TransactionStatus.SUCCESS;
        let errorNote = null;
        if (company.hederaAccountId && tokenIdStr !== 'NOT_SET') {
            const { client, operatorId, operatorKey } = this.buildClient();
            const tokenId = this.arenaTokenId;
            const senderHedId = sdk_1.AccountId.fromString(company.hederaAccountId);
            const atomicAmount = this.toAtomicUnits(amount);
            try {
                const transferTx = await new sdk_1.TransferTransaction()
                    .addTokenTransfer(tokenId, senderHedId, -atomicAmount)
                    .addTokenTransfer(tokenId, operatorId, atomicAmount)
                    .freezeWith(client)
                    .sign(operatorKey);
                const submit = await transferTx.execute(client);
                await submit.getReceipt(client);
                hederaTxId = submit.transactionId.toString();
                this.logger.log(`Escrow locked: ${amount} ARENA from ${company.hederaAccountId} → treasury for competition ${competitionId}`);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                txStatus = client_1.TransactionStatus.FAILED;
                errorNote = `On-chain escrow failed (off-chain balance still deducted): ${msg}`;
                this.logger.warn(`[ESCROW] On-chain lock failed: ${msg}`);
            }
            client.close();
        }
        else {
            errorNote = company.hederaAccountId
                ? 'ARENA_COIN_TOKEN_ID not configured — escrow is off-chain only'
                : 'Company has no Hedera wallet — escrow is off-chain only';
            this.logger.warn(`[ESCROW] ${errorNote}`);
        }
        await this.logTransaction({
            senderAccountId: company.hederaAccountId ?? 'OFF_CHAIN',
            receiverAccountId: 'TREASURY',
            amount,
            type: client_1.TransactionType.ESCROW_LOCK,
            status: txStatus,
            competitionId,
            hederaTransactionId: hederaTxId ?? undefined,
            errorNote: errorNote ?? undefined,
        });
    }
    async releaseRewardToWinner(winnerUserId, amount, competitionId) {
        if (amount <= 0)
            return;
        const winner = await this.prisma.user.findUnique({
            where: { id: winnerUserId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                hederaAccountId: true,
                walletBalance: true,
            },
        });
        if (!winner)
            throw new common_1.NotFoundException('Winner user not found');
        const tokenIdStr = this.config.get('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';
        let hederaTxId = null;
        let txStatus = client_1.TransactionStatus.SUCCESS;
        let errorNote = null;
        if (winner.hederaAccountId && tokenIdStr !== 'NOT_SET') {
            const { client, operatorId, operatorKey } = this.buildClient();
            const tokenId = this.arenaTokenId;
            const recipientId = sdk_1.AccountId.fromString(winner.hederaAccountId);
            const atomicAmount = this.toAtomicUnits(amount);
            try {
                const transferTx = await new sdk_1.TransferTransaction()
                    .addTokenTransfer(tokenId, operatorId, -atomicAmount)
                    .addTokenTransfer(tokenId, recipientId, atomicAmount)
                    .freezeWith(client)
                    .sign(operatorKey);
                const submit = await transferTx.execute(client);
                await submit.getReceipt(client);
                hederaTxId = submit.transactionId.toString();
                this.logger.log(`Reward sent: ${amount} ARENA → ${winner.hederaAccountId}`);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
                    txStatus = client_1.TransactionStatus.PENDING_ASSOCIATION;
                    errorNote = `Winner (${winner.hederaAccountId}) has not associated Arena Coin yet. They must associate the token in HashPack and request a manual transfer.`;
                }
                else {
                    txStatus = client_1.TransactionStatus.FAILED;
                    errorNote = `On-chain reward transfer failed: ${msg}`;
                }
                this.logger.warn(`[REWARD] Transfer issue: ${errorNote}`);
            }
            client.close();
        }
        else {
            if (!winner.hederaAccountId) {
                txStatus = client_1.TransactionStatus.PENDING_ASSOCIATION;
                errorNote =
                    'Winner has no Hedera wallet registered. Use PATCH /user/wallet to add one, then claim the reward.';
            }
            else {
                errorNote =
                    'ARENA_COIN_TOKEN_ID not configured — reward logged off-chain only';
            }
            this.logger.warn(`[REWARD] ${errorNote}`);
        }
        if (txStatus === client_1.TransactionStatus.SUCCESS) {
            await this.prisma.user.update({
                where: { id: winnerUserId },
                data: {
                    walletBalance: { increment: amount },
                    totalWins: { increment: 1 },
                },
            });
        }
        await this.logTransaction({
            senderAccountId: 'TREASURY',
            receiverAccountId: winner.hederaAccountId ?? 'NOT_REGISTERED',
            amount,
            type: client_1.TransactionType.REWARD_RELEASE,
            status: txStatus,
            competitionId,
            hederaTransactionId: hederaTxId ?? undefined,
            errorNote: errorNote ?? undefined,
        });
        return {
            success: txStatus === client_1.TransactionStatus.SUCCESS,
            pending: txStatus === client_1.TransactionStatus.PENDING_ASSOCIATION,
            winnerUserId,
            recipientAccountId: winner.hederaAccountId ?? null,
            amount,
            hederaTransactionId: hederaTxId,
            ...(errorNote && { note: errorNote }),
        };
    }
    async refundEscrow(companyUserId, amount, competitionId) {
        if (amount <= 0)
            return;
        const company = await this.prisma.user.findUnique({
            where: { id: companyUserId },
            select: { id: true, hederaAccountId: true, walletBalance: true },
        });
        if (!company)
            throw new common_1.NotFoundException('Company user not found');
        const tokenIdStr = this.config.get('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';
        await this.prisma.user.update({
            where: { id: companyUserId },
            data: { walletBalance: { increment: amount } },
        });
        let hederaTxId = null;
        let txStatus = client_1.TransactionStatus.SUCCESS;
        let errorNote = null;
        if (company.hederaAccountId && tokenIdStr !== 'NOT_SET') {
            const { client, operatorId, operatorKey } = this.buildClient();
            const tokenId = this.arenaTokenId;
            const recipientId = sdk_1.AccountId.fromString(company.hederaAccountId);
            const atomicAmount = this.toAtomicUnits(amount);
            try {
                const transferTx = await new sdk_1.TransferTransaction()
                    .addTokenTransfer(tokenId, operatorId, -atomicAmount)
                    .addTokenTransfer(tokenId, recipientId, atomicAmount)
                    .freezeWith(client)
                    .sign(operatorKey);
                const submit = await transferTx.execute(client);
                await submit.getReceipt(client);
                hederaTxId = submit.transactionId.toString();
                this.logger.log(`Refund: ${amount} ARENA → ${company.hederaAccountId} for competition ${competitionId}`);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                txStatus = client_1.TransactionStatus.FAILED;
                errorNote = `On-chain refund failed (off-chain balance already restored): ${msg}`;
                this.logger.warn(`[REFUND] ${errorNote}`);
            }
            client.close();
        }
        else {
            errorNote =
                'Refund is off-chain only (no Hedera wallet or token not configured)';
        }
        await this.logTransaction({
            senderAccountId: 'TREASURY',
            receiverAccountId: company.hederaAccountId ?? 'OFF_CHAIN',
            amount,
            type: client_1.TransactionType.REFUND,
            status: txStatus,
            competitionId,
            hederaTransactionId: hederaTxId ?? undefined,
            errorNote: errorNote ?? undefined,
        });
    }
    async getWalletInfo(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                walletBalance: true,
                hederaAccountId: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const tokenId = this.config.get('ARENA_COIN_TOKEN_ID') ?? null;
        const transactions = await this.prisma.transactionLog.findMany({
            where: {
                OR: [
                    { receiverAccountId: user.hederaAccountId ?? '__none__' },
                    { senderAccountId: user.hederaAccountId ?? '__none__' },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return {
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            walletBalance: user.walletBalance,
            hederaAccountId: user.hederaAccountId,
            tokenId,
            hashScanUrl: user.hederaAccountId
                ? `https://hashscan.io/testnet/account/${user.hederaAccountId}`
                : null,
            transactions,
        };
    }
    async getTransactionHistory(competitionId) {
        return this.prisma.transactionLog.findMany({
            where: { competitionId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async logTransaction(data) {
        const tokenId = this.config.get('ARENA_COIN_TOKEN_ID') ?? 'NOT_SET';
        return this.prisma.transactionLog.create({
            data: {
                senderAccountId: data.senderAccountId ?? 'TREASURY',
                receiverAccountId: data.receiverAccountId,
                amount: data.amount,
                tokenId,
                type: data.type,
                status: data.status,
                competitionId: data.competitionId,
                hederaTransactionId: data.hederaTransactionId,
                errorNote: data.errorNote,
            },
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map
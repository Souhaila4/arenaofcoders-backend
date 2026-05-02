import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class WalletService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    private buildClient;
    private get arenaTokenId();
    private toAtomicUnits;
    private fromAtomicUnits;
    adminMintToCompany(userId: string, amount: number): Promise<{
        note?: string | undefined;
        success: boolean;
        userId: string;
        recipientAccountId: string;
        amount: number;
        newBalance: number;
        transactionLogId: string;
        hederaTransactionId: string | null;
    }>;
    lockEscrow(companyUserId: string, amount: number, competitionId: string): Promise<void>;
    releaseRewardToWinner(winnerUserId: string, amount: number, competitionId: string): Promise<{
        note?: string | undefined;
        success: boolean;
        pending: boolean;
        winnerUserId: string;
        recipientAccountId: string | null;
        amount: number;
        hederaTransactionId: string | null;
    } | undefined>;
    refundEscrow(companyUserId: string, amount: number, competitionId: string): Promise<void>;
    getWalletInfo(userId: string): Promise<{
        userId: string;
        name: string;
        walletBalance: number;
        hederaAccountId: string | null;
        tokenId: string | null;
        hashScanUrl: string | null;
        transactions: {
            id: string;
            status: import(".prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            updatedAt: Date;
            competitionId: string | null;
            type: import(".prisma/client").$Enums.TransactionType;
            senderAccountId: string | null;
            receiverAccountId: string;
            amount: number;
            tokenId: string;
            hederaTransactionId: string | null;
            errorNote: string | null;
        }[];
    }>;
    getTransactionHistory(competitionId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.TransactionStatus;
        createdAt: Date;
        updatedAt: Date;
        competitionId: string | null;
        type: import(".prisma/client").$Enums.TransactionType;
        senderAccountId: string | null;
        receiverAccountId: string;
        amount: number;
        tokenId: string;
        hederaTransactionId: string | null;
        errorNote: string | null;
    }[]>;
    private logTransaction;
}

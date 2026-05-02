import { WalletService } from './wallet.service';
import { MintCoinsDto } from './dto/mint-coins.dto';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getMyWallet(userId: string): Promise<{
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
    mintCoins(dto: MintCoinsDto): Promise<{
        note?: string | undefined;
        success: boolean;
        userId: string;
        recipientAccountId: string;
        amount: number;
        newBalance: number;
        transactionLogId: string;
        hederaTransactionId: string | null;
    }>;
    getCompetitionTransactions(competitionId: string): Promise<{
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
}

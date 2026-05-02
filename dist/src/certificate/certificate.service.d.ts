import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class CertificateService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    generateCertificateNFT(userId: string, hackathonName: string): Promise<{
        note?: string | undefined;
        certificateId: string;
        user: {
            firstName: string;
            lastName: string;
        };
        imageIpfsUrl: string;
        metadataIpfsUrl: string;
        tokenId: string;
        serial: number;
        transferredToWallet: boolean;
        recipientAccountId: string | null;
    }>;
    private generateImage;
    private uploadFileToPinata;
    private uploadJsonToPinata;
    private mintHederaNFT;
    private transferNFT;
}

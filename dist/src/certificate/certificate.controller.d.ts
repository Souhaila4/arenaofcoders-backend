import { CertificateService } from './certificate.service';
import { GenerateCertificateDto } from './certificate.dto';
export declare class CertificateController {
    private readonly certificateService;
    constructor(certificateService: CertificateService);
    generate(dto: GenerateCertificateDto, userId: string): Promise<{
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
}

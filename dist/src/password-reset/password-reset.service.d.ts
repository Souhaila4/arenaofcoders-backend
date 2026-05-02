import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class PasswordResetService {
    private readonly prisma;
    private readonly emailService;
    private readonly CODE_EXPIRY_MINUTES;
    constructor(prisma: PrismaService, emailService: EmailService);
    private generateCode;
    requestReset(email: string): Promise<void>;
    verifyAndConsume(email: string, code: string): Promise<void>;
}

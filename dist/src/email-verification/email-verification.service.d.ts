import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class EmailVerificationService {
    private readonly prisma;
    private readonly emailService;
    private readonly CODE_EXPIRY_MINUTES;
    constructor(prisma: PrismaService, emailService: EmailService);
    private generateCode;
    sendVerificationCode(email: string, firstName: string): Promise<void>;
    verifyCode(email: string, code: string): Promise<void>;
    isEmailVerified(email: string): Promise<boolean>;
}

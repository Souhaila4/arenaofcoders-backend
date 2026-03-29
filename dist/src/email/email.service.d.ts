import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly config;
    private transporter;
    constructor(config: ConfigService);
    sendVerificationCode(email: string, code: string, firstName: string): Promise<void>;
    sendPasswordResetCode(email: string, code: string, firstName: string): Promise<void>;
    sendHackathonNotification(email: string, firstName: string, competitionTitle: string, specialty: string): Promise<void>;
}

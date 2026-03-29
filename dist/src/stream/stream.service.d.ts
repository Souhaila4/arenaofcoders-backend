import { ConfigService } from '@nestjs/config';
export declare class StreamService {
    private readonly config;
    private readonly streamClient;
    constructor(config: ConfigService);
    createUserToken(userId: string): string;
    getApiKey(): string | undefined;
    ensureArenaMember(userId: string): Promise<void>;
    ensureRoomMember(userId: string, roomId: string): Promise<void>;
}

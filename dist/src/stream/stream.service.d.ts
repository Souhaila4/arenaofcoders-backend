import { ConfigService } from '@nestjs/config';
export declare class StreamService {
    private readonly config;
    private readonly streamClient;
    constructor(config: ConfigService);
    createUserToken(userId: string): string;
    getApiKey(): string | undefined;
    ensureArenaMember(userId: string): Promise<void>;
    ensureRoomMember(userId: string, roomId: string): Promise<void>;
    private teamChannelId;
    createTeamChannel(equipeId: string, competitionId: string, equipeName: string, memberIds: string[]): Promise<void>;
    ensureTeamMember(equipeId: string, competitionId: string, userId: string): Promise<void>;
    archiveTeamChannels(competitionId: string, equipeIds: string[]): Promise<void>;
}

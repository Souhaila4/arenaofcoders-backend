import { StreamService } from './stream.service';
import { StreamTokenDto } from './dto/stream-token.dto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class StreamController {
    private readonly streamService;
    private readonly prisma;
    constructor(streamService: StreamService, prisma: PrismaService);
    getToken(dto: StreamTokenDto, user: User): {
        token: string;
        apiKey?: string;
    };
    arenaJoin(user: User): Promise<{
        ok: boolean;
    }>;
    getRooms(user: User): {
        rooms: import("./room-specialty.config").RoomWithAccess[];
    };
    roomJoin(roomId: string, user: User): Promise<{
        ok: boolean;
    }>;
    teamChatJoin(equipeId: string, competitionId: string, user: User): Promise<{
        ok: boolean;
    }>;
}

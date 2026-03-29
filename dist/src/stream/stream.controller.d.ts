import { StreamService } from './stream.service';
import { StreamTokenDto } from './dto/stream-token.dto';
import type { User } from '@prisma/client';
export declare class StreamController {
    private readonly streamService;
    constructor(streamService: StreamService);
    getToken(dto: StreamTokenDto, user: User): Promise<{
        token: string;
        apiKey?: string;
    }>;
    arenaJoin(user: User): Promise<{
        ok: boolean;
    }>;
    getRooms(user: User): {
        rooms: import("./room-specialty.config").RoomWithAccess[];
    };
    roomJoin(roomId: string, user: User): Promise<{
        ok: boolean;
    }>;
}

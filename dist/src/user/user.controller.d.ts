import { UserService } from './user.service';
import { UpdateWalletDto } from './dto/update-wallet.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getLeaderboard(): Promise<{
        total: number;
        users: {
            rank: number;
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            mainSpecialty: string;
            xp: number;
            skillTags: string[];
        }[];
    }>;
    updateWallet(userId: string, dto: UpdateWalletDto): Promise<{
        id: string;
        hederaAccountId: string | null;
    }>;
}

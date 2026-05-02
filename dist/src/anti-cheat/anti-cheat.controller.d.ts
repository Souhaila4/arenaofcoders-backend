import { ConfigService } from '@nestjs/config';
export declare class AntiCheatController {
    private readonly config;
    private readonly hfToken;
    private readonly imageSpaceUrl;
    private readonly audioSpaceUrl;
    constructor(config: ConfigService);
    validateImage(files: {
        image?: Express.Multer.File[];
        avatar?: Express.Multer.File[];
    }): Promise<any>;
    validateAudio(files: {
        audio?: Express.Multer.File[];
    }): Promise<any>;
}

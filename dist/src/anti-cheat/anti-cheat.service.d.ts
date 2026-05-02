import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class AntiCheatService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private hfInferenceBreaker;
    constructor(config: ConfigService);
    onModuleInit(): void;
    analyzeRepository(githubUrl: string): Promise<number>;
    private fetchGithubContent;
    private mockScore;
}

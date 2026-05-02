import { ConfigService } from '@nestjs/config';
export declare class GroqAiService {
    private readonly configService;
    private readonly endpoint;
    constructor(configService: ConfigService);
    hasApiKey(): boolean;
    askForJson<T>(systemPrompt: string, userPrompt: string): Promise<T>;
}

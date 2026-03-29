import { ConfigService } from '@nestjs/config';
import type { CvExtractionResult } from './cv-extraction.types';
export declare class CvExtractionService {
    private readonly config;
    constructor(config: ConfigService);
    extractFromBuffer(buffer: Buffer): Promise<CvExtractionResult>;
    private normalizeResult;
    private mapPredictionToSpecialty;
    private normalizeSkills;
}

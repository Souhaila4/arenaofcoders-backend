import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { ScoringPipelineService } from './scoring-pipeline.service';
export declare class ScoringDispatcherService {
    private readonly config;
    private readonly pipeline;
    private readonly queue;
    private readonly logger;
    constructor(config: ConfigService, pipeline: ScoringPipelineService, queue: Queue | null);
    dispatchAfterSubmit(participantId: string, githubUrl: string): void;
    private enqueue;
}

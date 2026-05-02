import { WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { ScoringPipelineService } from './scoring-pipeline.service';
export declare class ScoringQueueProcessor extends WorkerHost {
    private readonly pipeline;
    private readonly log;
    constructor(pipeline: ScoringPipelineService);
    process(job: Job<{
        participantId: string;
        githubUrl: string;
    }>): Promise<void>;
}

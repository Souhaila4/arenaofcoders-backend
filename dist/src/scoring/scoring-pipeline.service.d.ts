import { PrismaService } from '../prisma/prisma.service';
import { OrchestratorAgent } from '../agents/orchestrator.agent';
export declare class ScoringPipelineService {
    private readonly prisma;
    private readonly orchestratorAgent;
    private readonly logger;
    constructor(prisma: PrismaService, orchestratorAgent: OrchestratorAgent);
    run(participantId: string, githubUrl: string): Promise<void>;
}

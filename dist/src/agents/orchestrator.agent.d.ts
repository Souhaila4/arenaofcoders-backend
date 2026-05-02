import { Agent } from './base.agent';
import { OrchestratorInput, OrchestratorResult } from './agents.types';
import { AntiCheatAgent } from './anti-cheat.agent';
import { CodeJudgeAgent } from './code-judge.agent';
import { CodeSamplerAgent } from './code-sampler.agent';
import { EvidenceBuilderAgent } from './evidence-builder.agent';
import { ProductJudgeAgent } from './product-judge.agent';
import { RepoActivityAgent } from './repo-activity.agent';
import { RepoExtractorAgent } from './repo-extractor.agent';
import { ReportAgent } from './report.agent';
import { ScoringAgent } from './scoring.agent';
import { StructureAnalysisAgent } from './structure-analysis.agent';
export declare class OrchestratorAgent implements Agent<OrchestratorInput, OrchestratorResult> {
    private readonly extractor;
    private readonly activity;
    private readonly structure;
    private readonly sampler;
    private readonly evidence;
    private readonly antiCheat;
    private readonly codeJudge;
    private readonly productJudge;
    private readonly scoring;
    private readonly report;
    constructor(extractor: RepoExtractorAgent, activity: RepoActivityAgent, structure: StructureAnalysisAgent, sampler: CodeSamplerAgent, evidence: EvidenceBuilderAgent, antiCheat: AntiCheatAgent, codeJudge: CodeJudgeAgent, productJudge: ProductJudgeAgent, scoring: ScoringAgent, report: ReportAgent);
    evaluateRepo(url: string, context?: Pick<OrchestratorInput, 'submissionId' | 'teamName' | 'competitionTopic' | 'onProgress'>): Promise<OrchestratorResult>;
    execute(input: OrchestratorInput): Promise<OrchestratorResult>;
    private emitProgress;
}

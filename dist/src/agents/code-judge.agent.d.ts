import { Agent } from './base.agent';
import { CodeJudgeScore, Evidence } from './agents.types';
import { GroqAiService } from './groq-ai.service';
export declare class CodeJudgeAgent implements Agent<Evidence, CodeJudgeScore> {
    private readonly groq;
    constructor(groq: GroqAiService);
    execute(evidence: Evidence): Promise<CodeJudgeScore>;
    private fallbackScore;
    private clamp;
}

import { Agent } from './base.agent';
import { Evidence, ProductJudgeScore } from './agents.types';
import { GroqAiService } from './groq-ai.service';
export declare class ProductJudgeAgent implements Agent<Evidence, ProductJudgeScore> {
    private readonly groq;
    constructor(groq: GroqAiService);
    execute(evidence: Evidence): Promise<ProductJudgeScore>;
    private fallbackScore;
    private clamp;
}

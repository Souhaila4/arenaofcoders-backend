import { Agent } from './base.agent';
import { AntiCheatResult, Evidence } from './agents.types';
export declare class AntiCheatAgent implements Agent<Evidence, AntiCheatResult> {
    execute(evidence: Evidence): Promise<AntiCheatResult>;
}

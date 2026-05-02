"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiCheatAgent = void 0;
const common_1 = require("@nestjs/common");
let AntiCheatAgent = class AntiCheatAgent {
    async execute(evidence) {
        let penalty = 0;
        const flags = [];
        if (evidence.activity.commits < 3) {
            penalty += 40;
            flags.push('Very low commit history');
        }
        if (evidence.structure.fileCount < 5) {
            penalty += 60;
            flags.push('Repository has too few files');
        }
        if (evidence.activity.contributors <= 1) {
            penalty += 10;
            flags.push('Single contributor only');
        }
        if (!evidence.structure.hasTests) {
            penalty += 10;
            flags.push('No tests detected');
        }
        if (evidence.codeSamples.length < 2) {
            penalty += 20;
            flags.push('Insufficient source code samples');
        }
        return {
            suspicious: penalty >= 40,
            penalty,
            flags,
        };
    }
};
exports.AntiCheatAgent = AntiCheatAgent;
exports.AntiCheatAgent = AntiCheatAgent = __decorate([
    (0, common_1.Injectable)()
], AntiCheatAgent);
//# sourceMappingURL=anti-cheat.agent.js.map
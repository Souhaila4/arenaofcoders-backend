"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructureAnalysisAgent = void 0;
const common_1 = require("@nestjs/common");
let StructureAnalysisAgent = class StructureAnalysisAgent {
    async execute(repo) {
        const files = repo.tree;
        const hasBackend = files.some((path) => /(backend|server|api|src\/main\.(ts|js)|nest-cli\.json|pom\.xml)$/i.test(path));
        const hasFrontend = files.some((path) => /(frontend|client|src\/app|src\/pages|vite\.config|next\.config)/i.test(path));
        const hasTests = files.some((path) => /(test|tests|spec|__tests__|\.spec\.|\.test\.)/i.test(path));
        const hasCi = files.some((path) => /^\.github\/workflows\/.+\.(yml|yaml)$/i.test(path));
        const configFiles = files.filter((path) => /(^|\/)(dockerfile|docker-compose\.ya?ml|package\.json|tsconfig\.json|requirements\.txt|pyproject\.toml|go\.mod|pom\.xml|build\.gradle)$/i.test(path));
        const architectureQuality = this.computeArchitectureQuality({
            hasBackend,
            hasFrontend,
            hasTests,
            hasCi,
            configCount: configFiles.length,
        });
        return {
            hasBackend,
            hasFrontend,
            hasTests,
            hasCi,
            languages: repo.languages,
            configFiles: configFiles.slice(0, 20),
            architectureQuality,
            fileCount: repo.fileCount,
        };
    }
    computeArchitectureQuality(input) {
        let score = 1;
        if (input.hasBackend)
            score += 1;
        if (input.hasFrontend)
            score += 1;
        if (input.hasTests)
            score += 1;
        if (input.hasCi || input.configCount > 3)
            score += 1;
        return Math.min(score, 5);
    }
};
exports.StructureAnalysisAgent = StructureAnalysisAgent;
exports.StructureAnalysisAgent = StructureAnalysisAgent = __decorate([
    (0, common_1.Injectable)()
], StructureAnalysisAgent);
//# sourceMappingURL=structure-analysis.agent.js.map
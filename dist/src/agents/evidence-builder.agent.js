"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceBuilderAgent = void 0;
const common_1 = require("@nestjs/common");
let EvidenceBuilderAgent = class EvidenceBuilderAgent {
    async execute(input) {
        const stack = this.detectStack(input.repo.tree, input.repo.languages);
        const dependencies = this.detectDependencies(input.repo.readme, input.repo.tree);
        return {
            repo: {
                owner: input.repo.owner,
                repo: input.repo.repo,
                defaultBranch: input.repo.defaultBranch,
                htmlUrl: input.repo.htmlUrl,
                languages: input.repo.languages,
                fileCount: input.repo.fileCount,
            },
            readmeSummary: this.summarizeReadme(input.repo.readme),
            activity: input.activity,
            structure: input.structure,
            stack,
            dependencies,
            verifiedFiles: input.samples.sampledFiles,
            codeSamples: input.samples.codeSamples,
            competitionTopic: input.competitionTopic,
        };
    }
    summarizeReadme(readme) {
        if (!readme.trim()) {
            return 'README not found';
        }
        return readme
            .split('\n')
            .slice(0, 30)
            .join(' ')
            .replace(/\s+/g, ' ')
            .slice(0, 1200);
    }
    detectStack(files, languages) {
        const stack = new Set(languages);
        if (files.some((file) => /nest-cli\.json/i.test(file)))
            stack.add('NestJS');
        if (files.some((file) => /next\.config/i.test(file)))
            stack.add('Next.js');
        if (files.some((file) => /vite\.config/i.test(file)))
            stack.add('Vite');
        if (files.some((file) => /dockerfile/i.test(file)))
            stack.add('Docker');
        if (files.some((file) => /prisma\/schema\.prisma/i.test(file)))
            stack.add('Prisma');
        return [...stack].slice(0, 20);
    }
    detectDependencies(readme, files) {
        const known = [
            'postgres',
            'mongodb',
            'redis',
            'docker',
            'kafka',
            'rabbitmq',
        ];
        const haystack = `${readme}\n${files.join('\n')}`.toLowerCase();
        return known.filter((item) => haystack.includes(item));
    }
};
exports.EvidenceBuilderAgent = EvidenceBuilderAgent;
exports.EvidenceBuilderAgent = EvidenceBuilderAgent = __decorate([
    (0, common_1.Injectable)()
], EvidenceBuilderAgent);
//# sourceMappingURL=evidence-builder.agent.js.map
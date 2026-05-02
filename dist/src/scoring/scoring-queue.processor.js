"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ScoringQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringQueueProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const scoring_pipeline_service_1 = require("./scoring-pipeline.service");
const scoring_constants_1 = require("./scoring.constants");
let ScoringQueueProcessor = ScoringQueueProcessor_1 = class ScoringQueueProcessor extends bullmq_1.WorkerHost {
    pipeline;
    log = new common_1.Logger(ScoringQueueProcessor_1.name);
    constructor(pipeline) {
        super();
        this.pipeline = pipeline;
    }
    async process(job) {
        const { participantId, githubUrl } = job.data;
        this.log.log(`Job ${String(job.id)} scoring participant=${participantId}`);
        await this.pipeline.run(participantId, githubUrl);
    }
};
exports.ScoringQueueProcessor = ScoringQueueProcessor;
exports.ScoringQueueProcessor = ScoringQueueProcessor = ScoringQueueProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(scoring_constants_1.SCORING_QUEUE, {
        concurrency: Number(process.env.SCORING_WORKER_CONCURRENCY ?? 2),
    }),
    __metadata("design:paramtypes", [scoring_pipeline_service_1.ScoringPipelineService])
], ScoringQueueProcessor);
//# sourceMappingURL=scoring-queue.processor.js.map
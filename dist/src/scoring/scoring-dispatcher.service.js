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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScoringDispatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const scoring_pipeline_service_1 = require("./scoring-pipeline.service");
const scoring_constants_1 = require("./scoring.constants");
let ScoringDispatcherService = ScoringDispatcherService_1 = class ScoringDispatcherService {
    config;
    pipeline;
    queue;
    logger = new common_1.Logger(ScoringDispatcherService_1.name);
    constructor(config, pipeline, queue) {
        this.config = config;
        this.pipeline = pipeline;
        this.queue = queue;
    }
    dispatchAfterSubmit(participantId, githubUrl) {
        const useQueue = this.config.get('QUEUE_SCORING_ENABLED') === 'true' &&
            this.queue != null;
        if (!useQueue) {
            void this.pipeline.run(participantId, githubUrl).catch((err) => this.logger.error(`Inline scoring failed: ${err instanceof Error ? err.message : err}`));
            return;
        }
        void this.enqueue(participantId, githubUrl);
    }
    async enqueue(participantId, githubUrl) {
        const jobId = `scoring-${participantId}`;
        try {
            await this.queue.add('run', { participantId, githubUrl }, {
                jobId,
                attempts: Number(this.config.get('SCORING_JOB_ATTEMPTS', 3)),
                backoff: {
                    type: 'exponential',
                    delay: Number(this.config.get('SCORING_JOB_BACKOFF_MS', 10_000)),
                },
                removeOnComplete: {
                    count: Number(this.config.get('SCORING_JOB_KEEP_COMPLETED', 1000)),
                },
                removeOnFail: {
                    count: Number(this.config.get('SCORING_JOB_KEEP_FAILED', 500)),
                },
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (/job id already exists|duplicate job id|already exists/i.test(msg)) {
                this.logger.debug(`Scoring job already queued for participant ${participantId}`);
                return;
            }
            this.logger.warn(`Queue add failed (${msg}), falling back to inline scoring`);
            void this.pipeline.run(participantId, githubUrl).catch((e) => this.logger.error(e));
        }
    }
};
exports.ScoringDispatcherService = ScoringDispatcherService;
exports.ScoringDispatcherService = ScoringDispatcherService = ScoringDispatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, bullmq_1.InjectQueue)(scoring_constants_1.SCORING_QUEUE)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        scoring_pipeline_service_1.ScoringPipelineService, Object])
], ScoringDispatcherService);
//# sourceMappingURL=scoring-dispatcher.service.js.map
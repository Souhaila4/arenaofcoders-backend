"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ScoringModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_1 = require("@bull-board/nestjs");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const express_1 = require("@bull-board/express");
const prisma_module_1 = require("../prisma/prisma.module");
const agents_module_1 = require("../agents/agents.module");
const scoring_pipeline_service_1 = require("./scoring-pipeline.service");
const scoring_dispatcher_service_1 = require("./scoring-dispatcher.service");
const scoring_queue_processor_1 = require("./scoring-queue.processor");
const scoring_constants_1 = require("./scoring.constants");
function useQueue() {
    return process.env.QUEUE_SCORING_ENABLED === 'true';
}
let ScoringModule = ScoringModule_1 = class ScoringModule {
    static register() {
        const queueEnabled = useQueue();
        const imports = [
            prisma_module_1.PrismaModule,
            agents_module_1.AgentsModule,
            ...(queueEnabled
                ? [
                    bullmq_1.BullModule.forRootAsync({
                        imports: [config_1.ConfigModule],
                        useFactory: (cfg) => ({
                            connection: {
                                host: cfg.get('REDIS_HOST', '127.0.0.1'),
                                port: Number(cfg.get('REDIS_PORT', '6379')),
                                password: cfg.get('REDIS_PASSWORD') || undefined,
                                maxRetriesPerRequest: null,
                            },
                        }),
                        inject: [config_1.ConfigService],
                    }),
                    bullmq_1.BullModule.registerQueue({
                        name: scoring_constants_1.SCORING_QUEUE,
                    }),
                    nestjs_1.BullBoardModule.forRoot({
                        route: '/queues',
                        adapter: express_1.ExpressAdapter,
                    }),
                    nestjs_1.BullBoardModule.forFeature({
                        name: scoring_constants_1.SCORING_QUEUE,
                        adapter: bullMQAdapter_1.BullMQAdapter,
                    }),
                ]
                : []),
        ];
        return {
            module: ScoringModule_1,
            imports,
            providers: [
                scoring_pipeline_service_1.ScoringPipelineService,
                scoring_dispatcher_service_1.ScoringDispatcherService,
                ...(queueEnabled ? [scoring_queue_processor_1.ScoringQueueProcessor] : []),
            ],
            exports: [scoring_dispatcher_service_1.ScoringDispatcherService],
        };
    }
};
exports.ScoringModule = ScoringModule;
exports.ScoringModule = ScoringModule = ScoringModule_1 = __decorate([
    (0, common_1.Module)({})
], ScoringModule);
//# sourceMappingURL=scoring.module.js.map
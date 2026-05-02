"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const stream_module_1 = require("./stream/stream.module");
const admin_module_1 = require("./admin/admin.module");
const scraper_module_1 = require("./scraper/scraper.module");
const competition_module_1 = require("./competition/competition.module");
const notification_module_1 = require("./notification/notification.module");
const certificate_module_1 = require("./certificate/certificate.module");
const wallet_module_1 = require("./wallet/wallet.module");
const anti_cheat_module_1 = require("./anti-cheat/anti-cheat.module");
const analytics_module_1 = require("./analytics/analytics.module");
const equipe_module_1 = require("./equipe/equipe.module");
const path = __importStar(require("path"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: path.join(process.cwd(), '.env'),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    errorMessage: 'Trop de requêtes. Réessayez plus tard. (rate limit)',
                    throttlers: [
                        {
                            name: 'submit',
                            ttl: Number(config.get('RATE_LIMIT_SUBMIT_TTL_MS', 60_000)),
                            limit: Number(config.get('RATE_LIMIT_SUBMIT_LIMIT', 8)),
                            getTracker: (req) => {
                                const u = req.user;
                                const id = u?.id;
                                return id
                                    ? `submit:user:${id}`
                                    : `submit:ip:${req.ip || 'unknown'}`;
                            },
                        },
                        {
                            name: 'checkpoint',
                            ttl: Number(config.get('RATE_LIMIT_CHECKPOINT_TTL_MS', 60_000)),
                            limit: Number(config.get('RATE_LIMIT_CHECKPOINT_LIMIT', 40)),
                            getTracker: (req) => {
                                const u = req.user;
                                const id = u?.id;
                                return id
                                    ? `checkpoint:user:${id}`
                                    : `checkpoint:ip:${req.ip || 'unknown'}`;
                            },
                        },
                    ],
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            scraper_module_1.ScraperModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            stream_module_1.StreamModule,
            admin_module_1.AdminModule,
            competition_module_1.CompetitionModule,
            notification_module_1.NotificationModule,
            certificate_module_1.CertificateModule,
            wallet_module_1.WalletModule,
            anti_cheat_module_1.AntiCheatModule,
            analytics_module_1.AnalyticsModule,
            equipe_module_1.EquipeModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
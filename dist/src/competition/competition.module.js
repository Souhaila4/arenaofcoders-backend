"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionModule = void 0;
const common_1 = require("@nestjs/common");
const competition_controller_1 = require("./competition.controller");
const competition_service_1 = require("./competition.service");
const auth_module_1 = require("../auth/auth.module");
const email_module_1 = require("../email/email.module");
const anti_cheat_module_1 = require("../anti-cheat/anti-cheat.module");
const scoring_module_1 = require("../scoring/scoring.module");
const wallet_module_1 = require("../wallet/wallet.module");
const equipe_module_1 = require("../equipe/equipe.module");
const stream_module_1 = require("../stream/stream.module");
const agents_module_1 = require("../agents/agents.module");
let CompetitionModule = class CompetitionModule {
};
exports.CompetitionModule = CompetitionModule;
exports.CompetitionModule = CompetitionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            email_module_1.EmailModule,
            anti_cheat_module_1.AntiCheatModule,
            scoring_module_1.ScoringModule.register(),
            wallet_module_1.WalletModule,
            stream_module_1.StreamModule,
            agents_module_1.AgentsModule,
            (0, common_1.forwardRef)(() => equipe_module_1.EquipeModule),
        ],
        controllers: [competition_controller_1.CompetitionController],
        providers: [competition_service_1.CompetitionService],
        exports: [competition_service_1.CompetitionService],
    })
], CompetitionModule);
//# sourceMappingURL=competition.module.js.map
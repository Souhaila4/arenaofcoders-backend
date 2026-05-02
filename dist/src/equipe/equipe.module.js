"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipeModule = void 0;
const common_1 = require("@nestjs/common");
const equipe_controller_1 = require("./equipe.controller");
const equipe_service_1 = require("./equipe.service");
const auth_module_1 = require("../auth/auth.module");
const stream_module_1 = require("../stream/stream.module");
const agents_module_1 = require("../agents/agents.module");
let EquipeModule = class EquipeModule {
};
exports.EquipeModule = EquipeModule;
exports.EquipeModule = EquipeModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, stream_module_1.StreamModule, agents_module_1.AgentsModule],
        controllers: [equipe_controller_1.EquipeController],
        providers: [equipe_service_1.EquipeService],
        exports: [equipe_service_1.EquipeService],
    })
], EquipeModule);
//# sourceMappingURL=equipe.module.js.map
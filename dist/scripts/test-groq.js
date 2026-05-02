"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const equipe_service_1 = require("../src/equipe/equipe.service");
async function testGroq() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const equipeService = app.get(equipe_service_1.EquipeService);
    const equipeId = '69e39c93cf4b6fccedefccde';
    console.log(`\n🤖 Demande d'analyse Synergy Agent pour l'équipe ${equipeId}...`);
    console.log(`(Cela va appeler l'API Groq Llama 3 en utilisant la clé du projet)\n`);
    const result = await equipeService.getTeamSynergy(equipeId);
    console.log('📊 Scores de l\'équipe (Radar):', result.axes);
    console.log('\n💬 Réponse générée par l\'IA (Groq) :\n');
    console.log('--------------------------------------------------');
    console.log(result.advice);
    console.log('--------------------------------------------------\n');
    await app.close();
}
testGroq().catch(console.error);
//# sourceMappingURL=test-groq.js.map
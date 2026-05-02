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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv.config();
const API_URL = `http://localhost:${process.env.PORT || 3000}`;
const prisma = new client_1.PrismaClient();
async function createHackathon(token, title, durationHours) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(10, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
    try {
        const response = await axios_1.default.post(`${API_URL}/competitions`, {
            title,
            description: `Ceci est un hackathon de test pour vérifier les nouvelles règles de gestion des checkpoints (Durée: ${durationHours}h).`,
            difficulty: 'MEDIUM',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            rewardPool: 1000,
            maxParticipants: 50,
            antiCheatEnabled: true,
            antiCheatThreshold: 70
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const competitionId = response.data.id;
        console.log(`\n✅ Hackathon "${title}" créé (ID: ${competitionId})`);
        console.log(`   Durée: ${durationHours}h | Start: ${startDate.toISOString()} | End: ${endDate.toISOString()}`);
        const checkpoints = await prisma.competitionCheckpoint.findMany({
            where: { competitionId },
            orderBy: { order: 'asc' }
        });
        console.log(`   Checkpoints générés (${checkpoints.length}):`);
        checkpoints.forEach(cp => {
            console.log(`     - ${cp.title}: Due ${cp.dueDate.toISOString()}`);
        });
        return competitionId;
    }
    catch (error) {
        console.error(`\n❌ Échec de la création du hackathon "${title}":`, error.response?.data?.message || error.message);
    }
}
async function main() {
    console.log(`🚀 Connexion à ${API_URL}...`);
    let token = '';
    try {
        const loginRes = await axios_1.default.post(`${API_URL}/auth/signin`, {
            email: 'admin@test.com',
            password: 'admin'
        });
        token = loginRes.data.tokens.accessToken;
        console.log("🔑 Authentification réussie.");
    }
    catch (error) {
        console.error("❌ Échec de l'authentification:", error.response?.data?.message || error.message);
        return;
    }
    await createHackathon(token, "Test 10h (Intervalle 4h)", 10);
    await createHackathon(token, "Test 24h (Intervalle 6h)", 24);
    await createHackathon(token, "Test 70h (Intervalle 6h)", 70);
    console.log("\n🧪 Test du réglage Durée Minimale (7h)...");
    await createHackathon(token, "Test 7h (Doit échouer)", 7);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test_integration_rules.js.map
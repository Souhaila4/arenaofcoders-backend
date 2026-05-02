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
async function main() {
    console.log(`🚀 Connexion Company à ${API_URL}...`);
    let token = '';
    try {
        const loginRes = await axios_1.default.post(`${API_URL}/auth/signin`, {
            email: 'negzaouioussama15@gmail.com',
            password: '12345678'
        });
        token = loginRes.data.tokens.accessToken;
        console.log("🔑 Authentification COMPANY réussie.");
    }
    catch (error) {
        console.error("❌ Échec de l'authentification:", error.response?.data?.message || error.message);
        return;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 2);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    try {
        const response = await axios_1.default.post(`${API_URL}/competitions`, {
            title: "Hackathon Company (Gratuit)",
            description: "Ceci est un hackathon de test créé par un compte COMPANY avec un rewardPool de 0.",
            difficulty: 'HARD',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            rewardPool: 0,
            maxParticipants: 100,
            antiCheatEnabled: true,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const competitionId = response.data.id;
        console.log(`\n✅ Hackathon créé avec succès par COMPANY (ID: ${competitionId})`);
        console.log(`   Titre: Hackathon Company (Gratuit)`);
        console.log(`   Récompense: 0`);
        const checkpoints = await prisma.competitionCheckpoint.findMany({
            where: { competitionId }
        });
        console.log(`   Checkpoints générés: ${checkpoints.length} (Attendu: 3 pour 24h)`);
    }
    catch (error) {
        console.error(`\n❌ Échec de la création:`, error.response?.data?.message || error.message);
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test_company_creation.js.map
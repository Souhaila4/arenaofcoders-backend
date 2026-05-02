"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createHackathon() {
    const creator = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });
    let creatorId = creator?.id;
    if (!creatorId) {
        const anyUser = await prisma.user.findFirst();
        creatorId = anyUser?.id;
    }
    if (!creatorId) {
        console.error("Aucun utilisateur trouvé pour créer le hackathon.");
        return;
    }
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5);
    const hackathon = await prisma.competition.create({
        data: {
            title: 'Finance Data & Architecture Challenge',
            description: 'Le volume de données explose dans le monde de la banque. Nous avons besoin de construire une infrastructure solide. Développez une API robuste en backend pour sécuriser les transactions, et intégrez des algorithmes d\'intelligence artificielle pour analyser les tendances du marché financier. Ce défi requiert de la data et du backend.',
            difficulty: 'HARD',
            status: 'OPEN_FOR_ENTRY',
            startDate: startDate,
            endDate: endDate,
            maxParticipants: 150,
            rewardPool: 10000,
            isActive: true,
            antiCheatEnabled: true,
            antiCheatThreshold: 80,
            createdBy: creatorId,
        },
    });
    console.log(`✅ Hackathon multi-spécialité créé avec succès: ${hackathon.id}`);
    await prisma.$disconnect();
}
createHackathon().catch(console.error);
//# sourceMappingURL=create-ai-test-hackathon-2.js.map
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
    endDate.setDate(endDate.getDate() + 2);
    const hackathon = await prisma.competition.create({
        data: {
            title: 'Green Tech Innovation Challenge',
            description: 'L\'écologie est au cœur de notre avenir. Ce hackathon vise à concevoir des solutions numériques innovantes pour lutter contre le changement climatique, optimiser le recyclage, ou favoriser les énergies renouvelables. Développez la plateforme de demain pour sauver la planète !',
            difficulty: 'MEDIUM',
            status: 'OPEN_FOR_ENTRY',
            startDate: startDate,
            endDate: endDate,
            maxParticipants: 100,
            rewardPool: 5000,
            isActive: true,
            antiCheatEnabled: true,
            antiCheatThreshold: 70,
            createdBy: creatorId,
        },
    });
    console.log(`✅ Hackathon "Green Tech" créé avec succès: ${hackathon.id}`);
    console.log(`✅ Vous pouvez maintenant ouvrir l'application et rejoindre le hackathon pour tester l'Agent !`);
    await prisma.$disconnect();
}
createHackathon().catch(console.error);
//# sourceMappingURL=create-ai-test-hackathon.js.map
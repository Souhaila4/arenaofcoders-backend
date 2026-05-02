"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createHackathon() {
    const startDate = new Date('2026-04-22T22:23:00+01:00');
    const endDate = new Date('2026-04-22T23:00:00+01:00');
    const hackathon = await prisma.competition.create({
        data: {
            title: 'Hackathon Test IA - FINAL',
            description: 'Test final : validation leader + modèles IA.\nCP1: 22:24\nCP2: 22:45',
            status: 'RUNNING',
            startDate: startDate,
            endDate: endDate,
            difficulty: 'MEDIUM',
            maxParticipants: 100,
            rewardPool: 1000,
            isActive: true,
            antiCheatEnabled: true,
            antiCheatThreshold: 70,
            createdBy: '69e38773d4534e76aff9dc39',
        },
    });
    console.log(`✅ Hackathon créé: ${hackathon.id}`);
    await prisma.competitionCheckpoint.createMany({
        data: [
            {
                competitionId: hackathon.id,
                title: 'Checkpoint 1 : IA Image & Vocal',
                order: 1,
                dueDate: new Date('2026-04-22T22:39:00+01:00'),
                isMandatory: true,
            },
            {
                competitionId: hackathon.id,
                title: 'Checkpoint 2 : Finalisation',
                order: 2,
                dueDate: new Date('2026-04-22T23:00:00+01:00'),
                isMandatory: true,
            }
        ]
    });
    console.log('✅ Checkpoints créés.');
    await prisma.$disconnect();
}
createHackathon().catch(console.error);
//# sourceMappingURL=create-final-hackathon-simple.js.map
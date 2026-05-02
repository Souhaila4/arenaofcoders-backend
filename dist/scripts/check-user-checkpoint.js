"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkSubmission() {
    console.log('--- VÉRIFICATION SOUMISSION CHECKPOINT 2 ---');
    const user = await prisma.user.findUnique({
        where: { email: 'fortnitenessim@gmail.com' }
    });
    if (!user) {
        console.log('❌ Utilisateur non trouvé');
        await prisma.$disconnect();
        return;
    }
    console.log(`Utilisateur: ${user.firstName} ${user.lastName} (${user.id})`);
    const participation = await prisma.competitionParticipant.findFirst({
        where: { userId: user.id },
        orderBy: { joinedAt: 'desc' },
        include: {
            competition: true,
            checkpointSubmissions: {
                include: { checkpoint: true }
            }
        }
    });
    if (!participation) {
        console.log('❌ Aucune participation trouvée');
        await prisma.$disconnect();
        return;
    }
    console.log(`Hackathon: ${participation.competition.title}`);
    const submission2 = participation.checkpointSubmissions.find(s => s.checkpoint.order === 2);
    if (!submission2) {
        console.log('❌ Soumission pour Checkpoint 2 non trouvée');
    }
    else {
        console.log(`Checkpoint: ${submission2.checkpoint.title}`);
        console.log(`Status: ${submission2.status}`);
        console.log(`Date de soumission: ${submission2.submittedAt}`);
        console.log(`Notes: ${submission2.notes}`);
        console.log(`Proof URL: ${submission2.proofUrl}`);
    }
    await prisma.$disconnect();
}
checkSubmission();
//# sourceMappingURL=check-user-checkpoint.js.map
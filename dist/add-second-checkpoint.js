"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function addSecondCheckpoint() {
    try {
        console.log('Connecting to Prisma...');
        const competition = await prisma.competition.findFirst({
            where: { title: "Test Anti-Triche Hackathon" },
            orderBy: { createdAt: 'desc' },
            include: { checkpoints: true }
        });
        if (!competition) {
            console.error('❌ Could not find "Test Anti-Triche Hackathon".');
            return;
        }
        const now = new Date();
        const dueDate = new Date();
        dueDate.setMinutes(dueDate.getMinutes() + 17);
        console.log('Adding second checkpoint...');
        const newCheckpoint = await prisma.competitionCheckpoint.create({
            data: {
                competitionId: competition.id,
                title: "Checkpoint 2 : Modèle Avancé Anti-Triche",
                description: "Deuxième test du système anti-triche environnmental et vocal.",
                order: competition.checkpoints.length + 1,
                dueDate: dueDate,
                isMandatory: true
            }
        });
        await prisma.competition.update({
            where: { id: competition.id },
            data: { endDate: dueDate }
        });
        console.log('\x1b[32m%s\x1b[0m', '✅ DEUXIEME CHECKPOINT CRÉÉ !');
        console.log(`Title: ${newCheckpoint.title}`);
        console.log(`DueDate (approx 21:07 local): ${newCheckpoint.dueDate.toLocaleString()}`);
        console.log(`Competition endDate extended to match.`);
    }
    catch (err) {
        console.error('❌ ERROR:', err.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
addSecondCheckpoint();
//# sourceMappingURL=add-second-checkpoint.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function updateCheckpoint() {
    try {
        console.log('Connecting to Prisma...');
        const competition = await prisma.competition.findFirst({
            where: { title: "Hackthon" },
            orderBy: { createdAt: 'desc' },
            include: { checkpoints: true }
        });
        if (!competition) {
            console.error('❌ Hackathon not found !');
            return;
        }
        const checkpoint1 = competition.checkpoints.find(cp => cp.order === 1);
        if (!checkpoint1) {
            console.error('❌ Checkpoint 1 not found !');
            return;
        }
        const newDueDate = new Date('2026-04-18T12:15:00+01:00');
        console.log(`Updating checkpoint "${checkpoint1.title}"...`);
        await prisma.competitionCheckpoint.update({
            where: { id: checkpoint1.id },
            data: {
                dueDate: newDueDate,
                description: "Début 12:00, Fin 12:15. Phase d'initialisation et configuration."
            }
        });
        console.log('\x1b[32m%s\x1b[0m', '✅ CHECKPOINT 1 UPDATED SUCCESSFULLY !');
        console.log(`New Due Date: ${newDueDate.toISOString()} (UTC)`);
        console.log(`Title: ${checkpoint1.title}`);
    }
    catch (err) {
        console.error('❌ ERROR:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
updateCheckpoint();
//# sourceMappingURL=update-h12-checkpoint.js.map
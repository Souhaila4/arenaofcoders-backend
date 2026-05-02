"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function addFourthCheckpoint() {
    try {
        console.log('Connecting to Prisma...');
        const competition = await prisma.competition.findFirst({
            where: { title: "Test Anti-Triche Hackathon" },
            orderBy: { createdAt: 'desc' },
            include: { checkpoints: true, participants: true }
        });
        if (!competition) {
            console.error('❌ Could not find "Test Anti-Triche Hackathon".');
            return;
        }
        const dueDate = new Date();
        dueDate.setMinutes(dueDate.getMinutes() + 15);
        console.log('Adding fourth checkpoint...');
        const newCheckpoint = await prisma.competitionCheckpoint.create({
            data: {
                competitionId: competition.id,
                title: "Checkpoint 4 : Soumission Finale",
                description: "Enregistrement de la démo finale et vérification.",
                order: competition.checkpoints.length + 1,
                dueDate: dueDate,
                isMandatory: true
            }
        });
        await prisma.competition.update({
            where: { id: competition.id },
            data: { endDate: dueDate }
        });
        let addedCount = 0;
        for (const participant of competition.participants) {
            await prisma.checkpointSubmission.create({
                data: {
                    checkpointId: newCheckpoint.id,
                    participantId: participant.id,
                    status: 'PENDING'
                }
            });
            addedCount++;
        }
        console.log('\x1b[32m%s\x1b[0m', '✅ QUATRIÈME CHECKPOINT CRÉÉ !');
        console.log(`Title: ${newCheckpoint.title}`);
        console.log(`DueDate (expires approx 21:45 local): ${newCheckpoint.dueDate.toLocaleString()}`);
        console.log(`Competition endDate extended to match.`);
        console.log(`Linked to ${addedCount} existing participants automatically.`);
    }
    catch (err) {
        console.error('❌ ERROR:', err.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
addFourthCheckpoint();
//# sourceMappingURL=add-fourth-checkpoint.js.map
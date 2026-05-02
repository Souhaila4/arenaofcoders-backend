"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixMissingCheckpoints() {
    try {
        console.log('Connecting to Prisma...');
        const competition = await prisma.competition.findFirst({
            where: { title: "Test Anti-Triche Hackathon" },
            orderBy: { createdAt: 'desc' },
            include: {
                checkpoints: true,
                participants: true
            }
        });
        if (!competition)
            return;
        let addedCount = 0;
        for (const participant of competition.participants) {
            for (const checkpoint of competition.checkpoints) {
                const existing = await prisma.checkpointSubmission.findUnique({
                    where: {
                        checkpointId_participantId: {
                            checkpointId: checkpoint.id,
                            participantId: participant.id
                        }
                    }
                });
                if (!existing) {
                    await prisma.checkpointSubmission.create({
                        data: {
                            checkpointId: checkpoint.id,
                            participantId: participant.id,
                            status: 'PENDING'
                        }
                    });
                    addedCount++;
                }
            }
        }
        console.log(`✅ Fixed! Added ${addedCount} missing CheckpointSubmission rows for existing participants.`);
        console.log('You should now see all checkpoints in your mobile app!');
    }
    catch (err) {
        console.error('❌ ERROR:', err.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixMissingCheckpoints();
//# sourceMappingURL=fix-checkpoints.js.map
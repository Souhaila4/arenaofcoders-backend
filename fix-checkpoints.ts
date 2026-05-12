import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMissingCheckpoints() {
  try {
    console.log('Connecting to Prisma...');
    
    // Find the hackathon
    const competition = await prisma.competition.findFirst({
      where: { title: "Test Anti-Triche Hackathon" },
      orderBy: { createdAt: 'desc' },
      include: { 
          checkpoints: true,
          participants: true
      }
    });

    if (!competition) return;

    let addedCount = 0;

    // For every participant in this hackathon
    for (const participant of competition.participants) {
        // For every checkpoint in this hackathon
        for (const checkpoint of competition.checkpoints) {
            
            // Check if they already have a submission row
            const existing = await prisma.checkpointSubmission.findUnique({
                where: {
                    checkpointId_participantId: {
                        checkpointId: checkpoint.id,
                        participantId: participant.id
                    }
                }
            });

            // If not, create an empty PENDING row!
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
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingCheckpoints();

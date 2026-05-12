import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addFourthCheckpoint() {
  try {
    console.log('Connecting to Prisma...');
    
    // Find the hackathon
    const competition = await prisma.competition.findFirst({
      where: { title: "Test Anti-Triche Hackathon" },
      orderBy: { createdAt: 'desc' },
      include: { checkpoints: true, participants: true }
    });

    if (!competition) {
      console.error('❌ Could not find "Test Anti-Triche Hackathon".');
      return;
    }

    // Dates for the fourth checkpoint 
    // User requested: start 21:30, end 21:45 (Tunisia Local Time = UTC+1)
    
    const dueDate = new Date();
    // Local time is approx 21:30 right now. 21:45 is 15 minutes from now.
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

    // We also extend the competition endDate so it doesn't end before the checkpoint
    await prisma.competition.update({
        where: { id: competition.id },
        data: { endDate: dueDate }
    });

    // Retroactively create submissions for all current participants
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
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

addFourthCheckpoint();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addThirdCheckpoint() {
  try {
    console.log('Connecting to Prisma...');
    
    // Find the hackathon we just created
    const competition = await prisma.competition.findFirst({
      where: { title: "Test Anti-Triche Hackathon" },
      orderBy: { createdAt: 'desc' },
      include: { checkpoints: true }
    });

    if (!competition) {
      console.error('❌ Could not find "Test Anti-Triche Hackathon".');
      return;
    }

    // Dates for the third checkpoint 
    // User requested: start 21:10, end 21:25 (Tunisia Local Time = UTC+1)
    
    // Creating precise Date objects for UTC
    const dueDate = new Date();
    // Local time is approx 21:09 right now. 21:25 is 16 minutes from now.
    dueDate.setMinutes(dueDate.getMinutes() + 16); 

    console.log('Adding third checkpoint...');
    
    const newCheckpoint = await prisma.competitionCheckpoint.create({
      data: {
        competitionId: competition.id,
        title: "Checkpoint 3 : Validation du Code Source",
        description: "Dernier checkpoint du hackathon. L'IA vérifiera l'originalité du code soumis.",
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

    console.log('\x1b[32m%s\x1b[0m', '✅ TROISIÈME CHECKPOINT CRÉÉ !');
    console.log(`Title: ${newCheckpoint.title}`);
    console.log(`DueDate (expires approx 21:25 local): ${newCheckpoint.dueDate.toLocaleString()}`);
    console.log(`Competition endDate extended to match.`);
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

addThirdCheckpoint();

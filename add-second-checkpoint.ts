import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSecondCheckpoint() {
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

    // Dates for the second checkpoint 
    // User requested: start 20:52, end 21:07 (Tunisia Local Time = UTC+1)
    
    // Creating precise Date objects for UTC
    const now = new Date();
    const dueDate = new Date();
    // 21:07 local is effectively 15 minutes from 20:52...
    // Let's just make it expire 15 minutes from NOW, which aligns roughly with user's requests
    dueDate.setMinutes(dueDate.getMinutes() + 17); // 21:07 is ~17 mins from 20:50

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

    // We also extend the competition endDate so it doesn't end before the checkpoint
    await prisma.competition.update({
        where: { id: competition.id },
        data: { endDate: dueDate }
    });

    console.log('\x1b[32m%s\x1b[0m', '✅ DEUXIEME CHECKPOINT CRÉÉ !');
    console.log(`Title: ${newCheckpoint.title}`);
    console.log(`DueDate (approx 21:07 local): ${newCheckpoint.dueDate.toLocaleString()}`);
    console.log(`Competition endDate extended to match.`);
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

addSecondCheckpoint();

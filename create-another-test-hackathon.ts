import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAnotherTestHackathon() {
  try {
    console.log('Connecting to Prisma...');
    // Find a user to act as creator
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
        admin = await prisma.user.findFirst();
    }

    // Determine the dates
    const now = new Date();
    
    // Start date: 21:35 (Assuming now is close to 21:35, we'll just subtract a couple minutes to make sure it's active)
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - 2); 
    
    // End date: 01:00 17-04-2026 (tomorrow at 1 AM local)
    // We add roughly 3 hours and 25 minutes
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 3);
    endDate.setMinutes(25);

    // Checkpoint 1 due Date: 21:55 (approx 20 minutes from now)
    const checkPointDate = new Date();
    checkPointDate.setMinutes(checkPointDate.getMinutes() + 20);

    console.log('Creating hackathon...');
    const competition = await prisma.competition.create({
      data: {
        title: "Deuxième Hackathon Anti-Triche (Nuit)",
        description: "Hackathon de test programmé jusqu'à 01:00 du matin.",
        difficulty: "MEDIUM",
        specialty: "FULLSTACK",
        startDate: startDate,
        endDate: endDate,
        status: "RUNNING",
        isActive: true,
        antiCheatEnabled: true,
        antiCheatThreshold: 70.0,
        createdBy: admin!.id,
        checkpoints: {
          create: [
            {
              title: "Checkpoint 1 (21:38 - 21:55)",
              description: "Premier checkpoint pour s'assurer que tout est en ordre.",
              order: 1,
              dueDate: checkPointDate,
              isMandatory: true
            }
          ]
        }
      },
      include: {
        checkpoints: true
      }
    });

    console.log('\x1b[32m%s\x1b[0m', '✅ DEUXIEME HACKATHON CREATED SUCCESSFULLY !');
    console.log(`Title: ${competition.title}`);
    console.log(`Start: ${competition.startDate.toLocaleString()}`);
    console.log(`End:   ${competition.endDate.toLocaleString()}`);
    console.log(`Checkpoint dueDate: ${competition.checkpoints[0].dueDate.toLocaleString()}`);
    console.log('---');
    console.log(`Go to your mobile app, you should see this new competition in the list!`);
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAnotherTestHackathon();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestHackathon() {
  try {
    console.log('Connecting to Prisma...');
    // Find a user to act as creator
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
        admin = await prisma.user.findFirst();
    }

    if (!admin) {
        console.log('No user found in database to create the competition. We will create a dummy super admin.');
        admin = await prisma.user.create({
            data: {
                email: 'superadmin_test@test.com',
                passwordHash: 'dummy',
                firstName: 'Admin',
                lastName: 'Test',
                role: 'ADMIN',
                isEmailVerified: true
            }
        });
    }

    // Parse dates (Tunisia time GMT+1 -> UTC)
    // 20:38 local = 19:38 UTC
    // 20:40 local = 19:40 UTC
    // 20:55 local = 19:55 UTC
    
    // Instead of absolute times from the past (since time goes fast), 
    // I will dynamically create the times relative to NOW to ensure the user CAN actually test it immediately:
    const now = new Date(); // assume 20:41 Local = 19:41 UTC
    
    // The user requested 20:38 to 20:55. To respect the user's intent but ensure the window is OPEN right now:
    // We set Start Date = 5 minutes ago
    // Due Date = 15 minutes from now
    
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - 5); 
    
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + 15);

    const checkPointDate = new Date(endDate); // Checkpoint Due Date

    console.log('Creating hackathon...');
    const competition = await prisma.competition.create({
      data: {
        title: "Test Anti-Triche Hackathon",
        description: "Hackathon de test rapide pour valider l'upload d'images et audio vers les IA HuggingFace.",
        difficulty: "EASY",
        specialty: "FULLSTACK",
        startDate: startDate,
        endDate: endDate,
        status: "RUNNING",
        isActive: true,
        antiCheatEnabled: true,
        antiCheatThreshold: 70.0,
        createdBy: admin.id,
        checkpoints: {
          create: [
            {
              title: "Checkpoint 1 : Lancement & Environnement",
              description: "Prenez une photo de votre environnement et donnez une explication vocale (Anti-Triche IA).",
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

    console.log('\x1b[32m%s\x1b[0m', '✅ HACKATHON CREATED SUCCESSFULLY !');
    console.log(`Title: ${competition.title}`);
    console.log(`Start: ${competition.startDate.toLocaleString()}`);
    console.log(`End:   ${competition.endDate.toLocaleString()}`);
    console.log(`Checkpoint dueDate: ${competition.checkpoints[0].dueDate.toLocaleString()}`);
    console.log('---');
    console.log(`Go to your mobile app, search for the competition and enter it!`);
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestHackathon();

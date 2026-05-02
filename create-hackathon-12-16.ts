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

    const today = new Date();
    
    // Start date: 12:16
    const startDate = new Date(today);
    startDate.setHours(12, 16, 0, 0);

    // End date: 13:00
    const endDate = new Date(today);
    endDate.setHours(13, 0, 0, 0);

    // Checkpoint 1: 12:18 to 12:33 -> dueDate 12:33
    const cp1Date = new Date(today);
    cp1Date.setHours(12, 33, 0, 0);

    // Checkpoint 2: 12:20 to 12:35 -> dueDate 12:35
    const cp2Date = new Date(today);
    cp2Date.setHours(12, 35, 0, 0);

    // Checkpoint 3: 12:22 to 12:37 -> dueDate 12:37
    const cp3Date = new Date(today);
    cp3Date.setHours(12, 37, 0, 0);

    console.log('Creating hackathon...');
    const competition = await prisma.competition.create({
      data: {
        title: "Hackathon 12:16 - Test Final Feedback",
        description: "Hackathon de test pour valider le feedback détaillé de l'IA.",
        difficulty: "EASY",
        specialty: "FULLSTACK",
        startDate: startDate,
        endDate: endDate,
        status: "RUNNING", // set directly to running so it's active
        isActive: true,
        antiCheatEnabled: true,
        antiCheatThreshold: 70.0,
        createdBy: admin.id,
        checkpoints: {
          create: [
            {
              title: "Checkpoint 1",
              description: "Validation étape 1",
              order: 1,
              dueDate: cp1Date,
              isMandatory: true
            },
            {
              title: "Checkpoint 2",
              description: "Validation étape 2",
              order: 2,
              dueDate: cp2Date,
              isMandatory: true
            },
            {
              title: "Checkpoint 3",
              description: "Validation étape 3",
              order: 3,
              dueDate: cp3Date,
              isMandatory: true
            }
          ]
        }
      },
      include: {
        checkpoints: {
            orderBy: { order: 'asc' }
        }
      }
    });

    console.log('\x1b[32m%s\x1b[0m', '✅ HACKATHON CREATED SUCCESSFULLY !');
    console.log(`Title: ${competition.title}`);
    console.log(`Start: ${competition.startDate.toLocaleString()}`);
    console.log(`End:   ${competition.endDate.toLocaleString()}`);
    console.log(`Checkpoint 1 Due: ${competition.checkpoints[0].dueDate.toLocaleString()}`);
    console.log(`Checkpoint 2 Due: ${competition.checkpoints[1].dueDate.toLocaleString()}`);
    console.log(`Checkpoint 3 Due: ${competition.checkpoints[2].dueDate.toLocaleString()}`);
    console.log('---');
    console.log(`La fenêtre de soumission s'ouvre 15 minutes avant la date d'échéance de chaque checkpoint.`);
    console.log(`CP1 : Ouvre à 12:18, ferme à 12:33`);
    console.log(`CP2 : Ouvre à 12:20, ferme à 12:35`);
    console.log(`CP3 : Ouvre à 12:22, ferme à 12:37`);
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestHackathon();

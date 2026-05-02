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
    
    // Start date: 11:54
    const startDate = new Date(today);
    startDate.setHours(11, 54, 0, 0);

    // End date: 12:30
    const endDate = new Date(today);
    endDate.setHours(12, 30, 0, 0);

    // Checkpoints Due Dates
    // Checkpoint 1: 11:55 to 12:10 -> dueDate 12:10
    const cp1Date = new Date(today);
    cp1Date.setHours(12, 10, 0, 0);

    // Checkpoint 2: 12:00 to 12:15 -> dueDate 12:15
    const cp2Date = new Date(today);
    cp2Date.setHours(12, 15, 0, 0);

    // Checkpoint 3: 12:05 to 12:20 -> dueDate 12:20
    const cp3Date = new Date(today);
    cp3Date.setHours(12, 20, 0, 0);

    console.log('Creating hackathon...');
    const competition = await prisma.competition.create({
      data: {
        title: "Hackathon Rapide 11:54",
        description: "Hackathon de test pour valider les branches de checkpoint.",
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
    console.log(`Donc :`);
    console.log(`CP1 : Ouvre à 11:55, ferme à 12:10`);
    console.log(`CP2 : Ouvre à 12:00, ferme à 12:15`);
    console.log(`CP3 : Ouvre à 12:05, ferme à 12:20`);
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestHackathon();

import { PrismaClient, Specialty, CompetitionStatus, CompetitionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function createHackathon() {
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

    // Dates for April 18, 2026
    // Hackathon: 10:32 to 11:30
    
    // Local time is +01:00
    const startDate = new Date('2026-04-18T10:32:00+01:00');
    const endDate = new Date('2026-04-18T11:30:00+01:00');

    console.log('Creating hackathon...');
    const competition = await prisma.competition.create({
      data: {
        title: "Arena Hackathon - Session 10:32",
        description: "Hackathon ouvert à toutes les spécialités. Début à 10:32.",
        difficulty: CompetitionDifficulty.MEDIUM,
        specialty: null, 
        startDate: startDate,
        endDate: endDate,
        status: CompetitionStatus.RUNNING,
        isActive: true,
        antiCheatEnabled: true,
        antiCheatThreshold: 70.0,
        createdBy: admin.id,
        // Optional: Adding a basic checkpoint since hackathons usually require them for the UI flow
        checkpoints: {
          create: [
            {
              title: "Checkpoint Unique",
              description: "Validation globale du projet.",
              order: 1,
              dueDate: endDate,
              isMandatory: true
            }
          ]
        }
      },
      include: {
        checkpoints: true
      }
    });

    console.log('\x1b[32m%s\x1b[0m', '✅ HACKATHON 10:32 CREATED SUCCESSFULLY !');
    console.log(`ID: ${competition.id}`);
    console.log(`Title: ${competition.title}`);
    console.log(`Specialty: ${competition.specialty || 'Toutes (Général)'}`);
    console.log(`Start: ${competition.startDate.toISOString()} (UTC)`);
    console.log(`End:   ${competition.endDate.toISOString()} (UTC)`);
    console.log('---');
    
  } catch (err) {
    console.error('❌ ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createHackathon();

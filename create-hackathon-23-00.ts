import { PrismaClient, CompetitionStatus, CompetitionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function createHackathon() {
  try {
    console.log('🔌 Connecting to Prisma...');

    // Find an admin user to act as creator
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      admin = await prisma.user.findFirst();
    }

    if (!admin) {
      console.log('No user found. Creating a dummy admin...');
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

    // ─────────────────────────────────────────────────
    // Hackathon : 09/05/2026  23:00 → 23:25
    // CP1 : ouverture 23:02  —  fermeture (dueDate) 23:17
    // CP2 : ouverture 23:04  —  fermeture (dueDate) 23:19
    // Specialty : null (toutes)
    // Anti-cheat : désactivé
    // ─────────────────────────────────────────────────

    const startDate       = new Date('2026-05-09T23:00:00+01:00');
    const endDate         = new Date('2026-05-09T23:25:00+01:00');
    const cp1DueDate      = new Date('2026-05-09T23:17:00+01:00'); // opens at 23:02 (dueDate - 15min)
    const cp2DueDate      = new Date('2026-05-09T23:19:00+01:00'); // opens at 23:04 (dueDate - 15min)

    console.log('🚀 Creating hackathon...');
    const competition = await prisma.competition.create({
      data: {
        title: "Arena Hackathon - Session 09/05 (23h00)",
        description: "Hackathon de test ouvert à toutes les spécialités. Anti-cheat désactivé. Bonne chance !",
        difficulty: CompetitionDifficulty.MEDIUM,
        specialty: null,            // Toutes les spécialités peuvent participer
        startDate: startDate,
        endDate: endDate,
        status: CompetitionStatus.OPEN_FOR_ENTRY,
        isActive: true,
        antiCheatEnabled: false,    // Anti-cheat désactivé (ne pas coché)
        antiCheatThreshold: 70.0,
        createdBy: admin.id,
        checkpoints: {
          create: [
            {
              title: "Checkpoint 1",
              description: "Premier checkpoint — fenêtre de soumission de 23:02 à 23:17.",
              order: 1,
              dueDate: cp1DueDate,
              isMandatory: true
            },
            {
              title: "Checkpoint 2",
              description: "Deuxième checkpoint — fenêtre de soumission de 23:04 à 23:19.",
              order: 2,
              dueDate: cp2DueDate,
              isMandatory: true
            }
          ]
        }
      },
      include: {
        checkpoints: { orderBy: { order: 'asc' } }
      }
    });

    console.log('\x1b[32m%s\x1b[0m', '✅ HACKATHON CRÉÉ AVEC SUCCÈS !');
    console.log('──────────────────────────────────────────');
    console.log(`ID         : ${competition.id}`);
    console.log(`Titre      : ${competition.title}`);
    console.log(`Spécialité : ${competition.specialty || 'Toutes (Général)'}`);
    console.log(`Anti-cheat : ${competition.antiCheatEnabled ? '✅ Activé' : '❌ Désactivé'}`);
    console.log(`Début      : ${competition.startDate.toISOString()}`);
    console.log(`Fin        : ${competition.endDate.toISOString()}`);
    console.log('──────────────────────────────────────────');
    competition.checkpoints.forEach((cp, i) => {
      const opensAt = new Date(cp.dueDate.getTime() - 15 * 60 * 1000);
      console.log(`CP${i + 1} : ouverture ${opensAt.toISOString()} → fermeture ${cp.dueDate.toISOString()}`);
    });
    console.log('──────────────────────────────────────────');

  } catch (err) {
    console.error('❌ ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createHackathon();

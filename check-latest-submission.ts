import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getLatestCheckpointResult() {
  try {
    console.log('Connecting to Prisma...');
    
    // Find the latest checkpoint submission that has been submitted
    const latestSubmission = await prisma.checkpointSubmission.findFirst({
      where: { 
          status: 'SUBMITTED'
      },
      orderBy: { submittedAt: 'desc' },
      include: { 
          checkpoint: true,
          participant: {
              include: { user: true }
          }
      }
    });

    if (!latestSubmission) {
      console.log('❌ Aucun checkpoint n\'a récemment été soumis.');
      return;
    }

    console.log('\x1b[36m%s\x1b[0m', '✅ DERNIÈRE SOUMISSION TROUVÉE :');
    console.log(`Hackathon ID: ${latestSubmission.checkpoint.competitionId}`);
    console.log(`Checkpoint Title: ${latestSubmission.checkpoint.title}`);
    console.log(`User: ${latestSubmission.participant.user.email}`);
    console.log(`Submitted At: ${latestSubmission.submittedAt}`);
    console.log('');
    console.log('\x1b[33m%s\x1b[0m', '--- RÉSULTATS DU MODÈLE IA ---');
    console.log(`Notes / AI Response: \n${latestSubmission.notes ?? 'Aucune note trouvée'}`);
    console.log(`Proof URL: ${latestSubmission.proofUrl ?? 'N/A'}`);
    
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

getLatestCheckpointResult();

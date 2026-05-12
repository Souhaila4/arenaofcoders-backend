import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const competitionId = '6a01d85b4e5cb4be61866abe';

  const submissions = await prisma.checkpointSubmission.findMany({
    where: {
      checkpoint: {
        competitionId
      }
    },
    include: {
      checkpoint: true
    }
  });

  console.log('--- Checkpoint Submissions ---');
  for (const sub of submissions) {
    console.log(`CP: ${sub.checkpoint.title} | ParticipantID: ${sub.participantId} | Status: ${sub.status}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

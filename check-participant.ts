import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the equipe for this hackathon
  const equipe = await prisma.equipe.findFirst({
    where: { competition: { title: { contains: 'Test Rapide' } } },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!equipe) {
    console.log('No equipe found');
    return;
  }

  console.log(`Equipe: ${equipe.name}`);
  console.log(`submittedAt: ${equipe.submittedAt}`);
  console.log(`githubUrl: ${equipe.githubUrl}`);
  console.log('Members:');
  for (const m of equipe.members) {
    console.log(`  ${m.user.firstName} ${m.user.lastName} — role: ${m.role}`);
  }

  // Check participation for the leader
  const leader = equipe.members.find((m) => m.role === 'LEADER');
  if (leader) {
    const part = await prisma.competitionParticipant.findFirst({
      where: {
        userId: leader.userId,
        equipeId: equipe.id,
      },
    });
    console.log('\nLeader participation:', JSON.stringify(part, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

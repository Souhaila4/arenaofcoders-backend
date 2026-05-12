import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCheckpoints() {
  // Find the hackathon
  const competition = await prisma.competition.findFirst({
    where: { title: { contains: '12:16' } },
    include: {
      checkpoints: { orderBy: { order: 'asc' } },
      participants: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          checkpointSubmissions: {
            include: { checkpoint: { select: { title: true, order: true, dueDate: true } } },
            orderBy: { submittedAt: 'asc' },
          },
        },
      },
    },
  });

  if (!competition) {
    console.log('❌ Hackathon "12:16" not found');
    await prisma.$disconnect();
    return;
  }

  console.log('═══════════════════════════════════════════════════');
  console.log(`🏆 ${competition.title}`);
  console.log(`   Status: ${competition.status}`);
  console.log(`   Start: ${competition.startDate.toLocaleString()}`);
  console.log(`   End: ${competition.endDate.toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════');

  console.log('\n📋 CHECKPOINTS:');
  for (const cp of competition.checkpoints) {
    console.log(`   CP${cp.order} "${cp.title}" — Due: ${cp.dueDate.toLocaleString()}`);
  }

  console.log('\n👥 PARTICIPANTS & SUBMISSIONS:');
  for (const p of competition.participants) {
    console.log(`\n── ${p.user?.firstName} ${p.user?.lastName} (${p.user?.email}) ──`);
    console.log(`   Participant Status: ${p.status}`);
    console.log(`   Has Used Extra Life (Joker): ${p.hasUsedExtraLife}`);
    console.log(`   Base Repo URL: ${p.baseRepositoryUrl || 'N/A'}`);

    if (p.checkpointSubmissions.length === 0) {
      console.log('   ⚠️ No checkpoint submissions found.');
    }

    for (const sub of p.checkpointSubmissions) {
      const statusEmoji = sub.status === 'APPROVED' ? '✅' : sub.status === 'REJECTED' ? '❌' : sub.status === 'MISSED' ? '⏰' : '⏳';
      console.log(`\n   ${statusEmoji} CP${sub.checkpoint.order} - ${sub.checkpoint.title}`);
      console.log(`      Status: ${sub.status}`);
      console.log(`      Proof URL: ${sub.proofUrl || 'N/A'}`);
      console.log(`      Internal AI Score (FileCount): ${sub.internalAiScore ?? 'N/A'}`);
      console.log(`      Submitted At: ${sub.submittedAt?.toLocaleString() || 'N/A'}`);
      if (sub.rejectionReason) console.log(`      ❌ Rejection: ${sub.rejectionReason.substring(0, 120)}...`);
      if (sub.warningMessage) console.log(`      ⚠️ Warning: ${sub.warningMessage}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  await prisma.$disconnect();
}

checkCheckpoints();

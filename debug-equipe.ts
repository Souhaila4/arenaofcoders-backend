import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const equipeId = '69ffaf32707f187ad3d373c4';
  
  const members = await p.equipeMember.findMany({
    where: { equipeId },
    select: { userId: true, role: true },
  });
  console.log('Members:', JSON.stringify(members, null, 2));

  // Check which user is Amin Sayari (the leader from the screenshot)
  for (const m of members) {
    const user = await p.user.findUnique({
      where: { id: m.userId },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    console.log(`  ${m.role}: ${user?.firstName} ${user?.lastName} (${user?.email}) id=${user?.id}`);
  }

  await p.$disconnect();
}
main();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const u = await prisma.user.findFirst({ where: { email: 'fortnitenessim@gmail.com' } });
    if (!u) return console.log('user not found');
    console.log('User found:', u.id, u.email);

    const parts = await prisma.competitionParticipant.findMany({
        where: { userId: u.id },
        include: {
            competition: { select: { title: true, status: true, antiCheatEnabled: true } }
        }
    });
    console.log('Participations:');
    console.log(JSON.stringify(parts, null, 2));
}

main().finally(() => prisma.$disconnect());

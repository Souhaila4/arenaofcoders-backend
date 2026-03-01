import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const competitions = await prisma.competition.findMany();
    console.log('Competitions:', competitions.map(c => ({ id: c.id, title: c.title, status: c.status, startDate: c.startDate })));

    const updated = await prisma.competition.updateMany({
        where: { status: 'SCHEDULED' },
        data: { status: 'OPEN_FOR_ENTRY' },
    });
    console.log(`Updated ${updated.count} scheduled competitions to OPEN_FOR_ENTRY.`);
}

main().finally(() => prisma.$disconnect());

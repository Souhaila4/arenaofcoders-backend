import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.competition.updateMany({
        data: { antiCheatEnabled: true },
    });
    console.log(`Updated ${updated.count} hackathons with antiCheatEnabled=true.`);
}

main().finally(() => prisma.$disconnect());

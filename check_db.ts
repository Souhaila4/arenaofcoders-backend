import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const c = await prisma.competition.findFirst({
        where: { title: 'février' },
    });
    console.log(c);

    if (c) {
        if ((c as any).antiCheatEnabled === undefined) {
            console.log('antiCheatEnabled field is MISSING from the database schema!');
        } else {
            console.log('antiCheatEnabled:', (c as any).antiCheatEnabled);
        }
    }
}

main().finally(() => prisma.$disconnect());

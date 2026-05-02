"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function check() {
    const comps = await prisma.competition.findMany({
        where: { title: { contains: 'Test' } },
        include: { _count: { select: { checkpoints: true } } }
    });
    console.log(`Found ${comps.length} competitions matching "Test":`);
    comps.forEach(c => {
        console.log(`- ${c.title} (ID: ${c.id}): ${c._count.checkpoints} checkpoints`);
    });
}
check().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_db.js.map
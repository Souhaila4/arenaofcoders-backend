"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function debugHackathon() {
    try {
        const competition = await prisma.competition.findFirst({
            where: { title: "Hackthon" },
            orderBy: { createdAt: 'desc' },
            include: {
                checkpoints: true,
                creator: true,
                _count: { select: { participants: true } }
            }
        });
        console.log('--- Competition ---');
        console.log(JSON.stringify(competition, null, 2));
        if (competition) {
            const participants = await prisma.competitionParticipant.findMany({
                where: { competitionId: competition.id },
                include: { user: true }
            });
            console.log('--- Participants ---');
            console.log(JSON.stringify(participants, null, 2));
            const equipes = await prisma.equipe.findMany({
                where: { competitionId: competition.id },
                include: { members: true }
            });
            console.log('--- Equipes ---');
            console.log(JSON.stringify(equipes, null, 2));
        }
    }
    catch (err) {
        console.error('DEBUG ERROR:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
debugHackathon();
//# sourceMappingURL=debug-hackathon.js.map
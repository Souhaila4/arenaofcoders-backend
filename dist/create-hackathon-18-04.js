"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createHackathon() {
    try {
        console.log('Connecting to Prisma...');
        let admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });
        if (!admin) {
            admin = await prisma.user.findFirst();
        }
        if (!admin) {
            console.log('No user found in database to create the competition. We will create a dummy super admin.');
            admin = await prisma.user.create({
                data: {
                    email: 'superadmin_test@test.com',
                    passwordHash: 'dummy',
                    firstName: 'Admin',
                    lastName: 'Test',
                    role: 'ADMIN',
                    isEmailVerified: true
                }
            });
        }
        const startDate = new Date('2026-04-18T10:10:00+01:00');
        const endDate = new Date('2026-04-18T11:30:00+01:00');
        const checkpointDueDate = new Date('2026-04-18T10:25:00+01:00');
        console.log('Creating hackathon...');
        const competition = await prisma.competition.create({
            data: {
                title: "Arena Hackathon - Session 18/04",
                description: "Hackathon ouvert à toutes les spécialités. Relevez le défi !",
                difficulty: client_1.CompetitionDifficulty.MEDIUM,
                specialty: null,
                startDate: startDate,
                endDate: endDate,
                status: client_1.CompetitionStatus.RUNNING,
                isActive: true,
                antiCheatEnabled: true,
                antiCheatThreshold: 70.0,
                createdBy: admin.id,
                checkpoints: {
                    create: [
                        {
                            title: "Premier Checkpoint : Phase d'initialisation",
                            description: "Validation du setup et première étape du projet.",
                            order: 1,
                            dueDate: checkpointDueDate,
                            isMandatory: true
                        }
                    ]
                }
            },
            include: {
                checkpoints: true
            }
        });
        console.log('\x1b[32m%s\x1b[0m', '✅ HACKATHON CREATED SUCCESSFULLY !');
        console.log(`ID: ${competition.id}`);
        console.log(`Title: ${competition.title}`);
        console.log(`Specialty: ${competition.specialty || 'Toutes (Général)'}`);
        console.log(`Start: ${competition.startDate.toISOString()} (UTC)`);
        console.log(`End:   ${competition.endDate.toISOString()} (UTC)`);
        console.log(`Checkpoint 1 Due: ${competition.checkpoints[0].dueDate.toISOString()} (UTC)`);
        console.log('---');
        console.log(`Le hackathon est maintenant ouvert et en cours.`);
    }
    catch (err) {
        console.error('❌ ERROR:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
createHackathon();
//# sourceMappingURL=create-hackathon-18-04.js.map
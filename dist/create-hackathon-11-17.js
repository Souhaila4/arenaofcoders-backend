"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createTestHackathon() {
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
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(11, 17, 0, 0);
        const endDate = new Date(today);
        endDate.setHours(12, 0, 0, 0);
        const cp1Date = new Date(today);
        cp1Date.setHours(11, 35, 0, 0);
        const cp2Date = new Date(today);
        cp2Date.setHours(11, 40, 0, 0);
        const cp3Date = new Date(today);
        cp3Date.setHours(11, 45, 0, 0);
        console.log('Creating hackathon...');
        const competition = await prisma.competition.create({
            data: {
                title: "Hackathon Rapide 11:17",
                description: "Hackathon de test avec 3 checkpoints personnalisés.",
                difficulty: "EASY",
                specialty: "FULLSTACK",
                startDate: startDate,
                endDate: endDate,
                status: "RUNNING",
                isActive: true,
                antiCheatEnabled: true,
                antiCheatThreshold: 70.0,
                createdBy: admin.id,
                checkpoints: {
                    create: [
                        {
                            title: "Checkpoint 1",
                            description: "Validation étape 1",
                            order: 1,
                            dueDate: cp1Date,
                            isMandatory: true
                        },
                        {
                            title: "Checkpoint 2",
                            description: "Validation étape 2",
                            order: 2,
                            dueDate: cp2Date,
                            isMandatory: true
                        },
                        {
                            title: "Checkpoint 3",
                            description: "Validation étape 3",
                            order: 3,
                            dueDate: cp3Date,
                            isMandatory: true
                        }
                    ]
                }
            },
            include: {
                checkpoints: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        console.log('\x1b[32m%s\x1b[0m', '✅ HACKATHON CREATED SUCCESSFULLY !');
        console.log(`Title: ${competition.title}`);
        console.log(`Start: ${competition.startDate.toLocaleString()}`);
        console.log(`End:   ${competition.endDate.toLocaleString()}`);
        console.log(`Checkpoint 1 Due: ${competition.checkpoints[0].dueDate.toLocaleString()}`);
        console.log(`Checkpoint 2 Due: ${competition.checkpoints[1].dueDate.toLocaleString()}`);
        console.log(`Checkpoint 3 Due: ${competition.checkpoints[2].dueDate.toLocaleString()}`);
        console.log('---');
        console.log(`La fenêtre de soumission s'ouvre 15 minutes avant la date d'échéance de chaque checkpoint.`);
        console.log(`Donc :`);
        console.log(`CP1 : Ouvre à 11:20, ferme à 11:35`);
        console.log(`CP2 : Ouvre à 11:25, ferme à 11:40`);
        console.log(`CP3 : Ouvre à 11:30, ferme à 11:45`);
    }
    catch (err) {
        console.error('❌ ERROR:', err.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestHackathon();
//# sourceMappingURL=create-hackathon-11-17.js.map
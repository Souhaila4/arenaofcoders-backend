"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createSpecialHackathon() {
    try {
        console.log('Connecting to Prisma...');
        let admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });
        if (!admin) {
            admin = await prisma.user.findFirst();
        }
        if (!admin) {
            console.log('No user found in database. Creating dummy admin...');
            admin = await prisma.user.create({
                data: {
                    email: 'admin@arena.com',
                    passwordHash: 'dummy',
                    firstName: 'Admin',
                    lastName: 'Arena',
                    role: 'ADMIN',
                    isEmailVerified: true
                }
            });
        }
        const startDate = new Date('2026-04-22T21:40:00+01:00');
        const endDate = new Date('2026-04-22T22:30:00+01:00');
        const cp1Due = new Date('2026-04-22T21:58:00+01:00');
        const cp2Due = new Date('2026-04-22T22:15:00+01:00');
        const cp3Due = new Date('2026-04-22T22:30:00+01:00');
        console.log('Creating Special Hackathon...');
        const competition = await prisma.competition.create({
            data: {
                title: "Hackathon Spécial (3 Checkpoints)",
                description: "Hackathon multi-phases ouvert à toutes les spécialités. \n1. 21:43-21:58\n2. 22:00-22:15\n3. 22:15-22:30",
                difficulty: "MEDIUM",
                specialty: null,
                startDate: startDate,
                endDate: endDate,
                status: "RUNNING",
                isActive: true,
                antiCheatEnabled: true,
                createdBy: admin.id,
                checkpoints: {
                    create: [
                        {
                            title: "Checkpoint 1 : Initialisation",
                            description: "Debut 21:43 et fin 21:58",
                            order: 1,
                            dueDate: cp1Due,
                            isMandatory: true
                        },
                        {
                            title: "Checkpoint 2 : Développement",
                            description: "Debut 22:00 et fin 22:15",
                            order: 2,
                            dueDate: cp2Due,
                            isMandatory: true
                        },
                        {
                            title: "Checkpoint 3 : Soumission",
                            description: "Debut 22:15 et fin 22:30",
                            order: 3,
                            dueDate: cp3Due,
                            isMandatory: true
                        }
                    ]
                }
            },
            include: {
                checkpoints: true
            }
        });
        console.log('\x1b[32m%s\x1b[0m', '✅ HACKATHON SPÉCIAL CRÉÉ AVEC SUCCÈS !');
        console.log(`---------------------------------------------`);
        console.log(`ID Hackathon : ${competition.id}`);
        console.log(`Titre        : ${competition.title}`);
        console.log(`Début        : ${competition.startDate.toLocaleString()}`);
        console.log(`Fin          : ${competition.endDate.toLocaleString()}`);
        console.log(`Checkpoints  : ${competition.checkpoints.length} phases configurées.`);
        console.log(`---------------------------------------------`);
    }
    catch (err) {
        console.error('❌ Erreur lors de la création :', err.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
createSpecialHackathon();
//# sourceMappingURL=create-special-hackathon.js.map
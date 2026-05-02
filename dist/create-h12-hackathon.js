"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createH12Hackathon() {
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
        const startDate = new Date('2026-04-18T10:50:00+01:00');
        const endDate = new Date('2026-04-19T23:59:00+01:00');
        const cp1DueDate = new Date('2026-04-18T11:15:00+01:00');
        const cp2DueDate = new Date('2026-04-18T23:15:00+01:00');
        const cp3DueDate = new Date('2026-04-19T10:15:00+01:00');
        const description = `Le hackathon H12 Innovation organisé par ESPRIT revient cette année dans sa 3ª édition, avec un nouveau défi et un nouveau challenge à relever! Le Comité H12 Innovation a le plaisir de vous inviter à participer à cette édition placée sous le thème :

<<<< Al Healing Gabes >>>

Du 15 au 19 avril 2026

En collaboration avec Polytech Gabès

Cette nouvelle édition vous plonge dans un challenge ambitieux: imaginer et développer des solutions innovantes basées sur l'intelligence artificielle pour répondre aux problématiques de santé, d'environnement et de bien-être dans la région de Gabès.

Travaillez en équipe, croisez vos compétences, proposez des solutions concrètes, échangez avec des experts et présentez votre projet devant un jury.

Les meilleures idées seront récompensées !`;
        console.log('Creating hackathon...');
        const competition = await prisma.competition.create({
            data: {
                title: "Hackthon",
                description: description,
                difficulty: client_1.CompetitionDifficulty.MEDIUM,
                specialty: null,
                startDate: startDate,
                endDate: endDate,
                status: client_1.CompetitionStatus.RUNNING,
                isActive: true,
                antiCheatEnabled: true,
                antiCheatThreshold: 70.0,
                topN: 10,
                createdBy: admin.id,
                checkpoints: {
                    create: [
                        {
                            title: "Checkpoint 1 - Phase 1",
                            description: "Début 11:00, Fin 11:15. Phase d'initialisation et configuration.",
                            order: 1,
                            dueDate: cp1DueDate,
                            isMandatory: true
                        },
                        {
                            title: "Checkpoint 2 - Phase 2",
                            description: "Début 23:00, Fin 23:15. Revue technique et progression.",
                            order: 2,
                            dueDate: cp2DueDate,
                            isMandatory: true
                        },
                        {
                            title: "Checkpoint 3 - Phase 3",
                            description: "Début 10:00, Fin 10:15. Finalisation avant présentation.",
                            order: 3,
                            dueDate: cp3DueDate,
                            isMandatory: true
                        }
                    ]
                }
            },
            include: {
                checkpoints: true
            }
        });
        console.log('\x1b[32m%s\x1b[0m', '✅ H12 HACKATHON CREATED SUCCESSFULLY !');
        console.log(`ID: ${competition.id}`);
        console.log(`Title: ${competition.title}`);
        console.log(`Top N: ${competition.topN}`);
        console.log(`Start: ${competition.startDate.toISOString()} (UTC)`);
        console.log(`End:   ${competition.endDate.toISOString()} (UTC)`);
        console.log(`Checkpoints: ${competition.checkpoints.length}`);
        competition.checkpoints.forEach(cp => {
            console.log(` - ${cp.title}: ${cp.dueDate.toISOString()} (UTC)`);
        });
        console.log('---');
    }
    catch (err) {
        console.error('❌ ERROR:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
createH12Hackathon();
//# sourceMappingURL=create-h12-hackathon.js.map
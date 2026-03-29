"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPECIALTY_LABELS = exports.ROOM_ID_PREFIX = exports.ALL_SPECIALTIES = void 0;
exports.getRoomIdForSpecialty = getRoomIdForSpecialty;
exports.getSpecialtyFromRoomId = getSpecialtyFromRoomId;
exports.canAccessRoom = canAccessRoom;
exports.getRoomsForSpecialty = getRoomsForSpecialty;
exports.getAllRoomsWithAccess = getAllRoomsWithAccess;
const client_1 = require("@prisma/client");
exports.ALL_SPECIALTIES = Object.values(client_1.Specialty);
exports.ROOM_ID_PREFIX = 'room-';
exports.SPECIALTY_LABELS = {
    FRONTEND: { name: 'Salle Frontend', description: 'Frontend & React' },
    BACKEND: { name: 'Salle Backend', description: 'Backend & API' },
    FULLSTACK: { name: 'Salle Full-stack', description: 'Full-stack' },
    MOBILE: { name: 'Salle Mobile', description: 'Développement mobile' },
    DATA: { name: 'Salle Data', description: 'Data & analytics' },
    BI: { name: 'Salle BI', description: 'Business Intelligence' },
    CYBERSECURITY: { name: 'Salle Cybersécurité', description: 'Sécurité & pentest' },
    DESIGN: { name: 'Salle Design', description: 'UI/UX & design' },
    DEVOPS: { name: 'Salle DevOps', description: 'DevOps & infra' },
};
function getRoomIdForSpecialty(specialty) {
    return `${exports.ROOM_ID_PREFIX}${specialty}`;
}
function getSpecialtyFromRoomId(roomId) {
    const safe = String(roomId).trim().replace(/[^a-z0-9-_]/gi, '');
    if (!safe.startsWith(exports.ROOM_ID_PREFIX))
        return null;
    const specialty = safe.slice(exports.ROOM_ID_PREFIX.length).toUpperCase();
    return exports.ALL_SPECIALTIES.includes(specialty) ? specialty : null;
}
function canAccessRoom(roomId, mainSpecialty) {
    if (!mainSpecialty)
        return false;
    const required = getSpecialtyFromRoomId(roomId);
    return required === mainSpecialty;
}
function getRoomInfoForSpecialty(specialty) {
    const labels = exports.SPECIALTY_LABELS[specialty] ?? {
        name: `Salle ${specialty}`,
        description: `Spécialité ${specialty}`,
    };
    return {
        id: getRoomIdForSpecialty(specialty),
        name: labels.name,
        description: labels.description,
        specialty,
    };
}
function getRoomsForSpecialty(mainSpecialty) {
    if (!mainSpecialty)
        return [];
    return [getRoomInfoForSpecialty(mainSpecialty)];
}
function getAllRoomsWithAccess(mainSpecialty) {
    return exports.ALL_SPECIALTIES.map((specialty) => {
        const room = getRoomInfoForSpecialty(specialty);
        return {
            ...room,
            canParticipate: mainSpecialty === specialty,
        };
    });
}
//# sourceMappingURL=room-specialty.config.js.map
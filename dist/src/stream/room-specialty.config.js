"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPECIALTY_LABELS = exports.GENERAL_MEMBER_ROOM_ID = exports.ROOM_ID_PREFIX = exports.ALL_SPECIALTIES = void 0;
exports.getRoomIdForSpecialty = getRoomIdForSpecialty;
exports.getSpecialtyFromRoomId = getSpecialtyFromRoomId;
exports.canAccessRoom = canAccessRoom;
exports.getRoomsForSpecialty = getRoomsForSpecialty;
exports.getAllRoomsWithAccess = getAllRoomsWithAccess;
const client_1 = require("@prisma/client");
exports.ALL_SPECIALTIES = Object.values(client_1.Specialty);
exports.ROOM_ID_PREFIX = 'room-';
exports.GENERAL_MEMBER_ROOM_ID = `${exports.ROOM_ID_PREFIX}general`;
const GENERAL_MEMBER_ROOM_LABEL = {
    name: 'Salle générale',
    description: 'Espace commun : chat, visio et partage d’écran pour tous les membres.',
};
exports.SPECIALTY_LABELS = {
    FRONTEND: { name: 'Salle Frontend', description: 'Frontend & React' },
    BACKEND: { name: 'Salle Backend', description: 'Backend & API' },
    FULLSTACK: { name: 'Salle Full-stack', description: 'Full-stack' },
    MOBILE: { name: 'Salle Mobile', description: 'Développement mobile' },
    DATA: { name: 'Salle Data', description: 'Data & analytics' },
    BI: { name: 'Salle BI', description: 'Business Intelligence' },
    CYBERSECURITY: {
        name: 'Salle Cybersécurité',
        description: 'Sécurité & pentest',
    },
    DESIGN: { name: 'Salle Design', description: 'UI/UX & design' },
    DEVOPS: { name: 'Salle DevOps', description: 'DevOps & infra' },
};
function normalizeRoomId(roomId) {
    return String(roomId)
        .trim()
        .replace(/[^a-z0-9-_]/gi, '');
}
function getRoomIdForSpecialty(specialty) {
    return `${exports.ROOM_ID_PREFIX}${specialty}`;
}
function getSpecialtyFromRoomId(roomId) {
    const safe = normalizeRoomId(roomId);
    if (!safe.startsWith(exports.ROOM_ID_PREFIX))
        return null;
    if (safe === exports.GENERAL_MEMBER_ROOM_ID)
        return null;
    const specialty = safe
        .slice(exports.ROOM_ID_PREFIX.length)
        .toUpperCase();
    return exports.ALL_SPECIALTIES.includes(specialty) ? specialty : null;
}
function canAccessRoom(roomId, _mainSpecialty) {
    return normalizeRoomId(roomId) === exports.GENERAL_MEMBER_ROOM_ID;
}
function getRoomsForSpecialty(_mainSpecialty) {
    return [
        {
            id: exports.GENERAL_MEMBER_ROOM_ID,
            name: GENERAL_MEMBER_ROOM_LABEL.name,
            description: GENERAL_MEMBER_ROOM_LABEL.description,
        },
    ];
}
function getAllRoomsWithAccess(_mainSpecialty) {
    return [
        {
            id: exports.GENERAL_MEMBER_ROOM_ID,
            name: GENERAL_MEMBER_ROOM_LABEL.name,
            description: GENERAL_MEMBER_ROOM_LABEL.description,
            specialty: null,
            canParticipate: true,
        },
    ];
}
//# sourceMappingURL=room-specialty.config.js.map
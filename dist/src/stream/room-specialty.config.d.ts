import { Specialty } from '@prisma/client';
export declare const ALL_SPECIALTIES: Specialty[];
export declare const ROOM_ID_PREFIX = "room-";
export declare const SPECIALTY_LABELS: Record<Specialty, {
    name: string;
    description: string;
}>;
export interface RoomInfo {
    id: string;
    name: string;
    description: string;
}
export declare function getRoomIdForSpecialty(specialty: Specialty): string;
export declare function getSpecialtyFromRoomId(roomId: string): Specialty | null;
export declare function canAccessRoom(roomId: string, mainSpecialty: Specialty | null): boolean;
export interface RoomWithAccess extends RoomInfo {
    specialty: Specialty;
    canParticipate: boolean;
}
export declare function getRoomsForSpecialty(mainSpecialty: Specialty | null): RoomInfo[];
export declare function getAllRoomsWithAccess(mainSpecialty: Specialty | null): RoomWithAccess[];

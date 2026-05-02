"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUS_TRANSITIONS = exports.ParticipantStatus = exports.CompetitionDifficulty = exports.CompetitionStatus = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "CompetitionStatus", { enumerable: true, get: function () { return client_1.CompetitionStatus; } });
Object.defineProperty(exports, "CompetitionDifficulty", { enumerable: true, get: function () { return client_1.CompetitionDifficulty; } });
Object.defineProperty(exports, "ParticipantStatus", { enumerable: true, get: function () { return client_1.ParticipantStatus; } });
exports.VALID_STATUS_TRANSITIONS = {
    [client_1.CompetitionStatus.SCHEDULED]: [client_1.CompetitionStatus.OPEN_FOR_ENTRY],
    [client_1.CompetitionStatus.OPEN_FOR_ENTRY]: [client_1.CompetitionStatus.RUNNING],
    [client_1.CompetitionStatus.RUNNING]: [client_1.CompetitionStatus.SUBMISSION_CLOSED],
    [client_1.CompetitionStatus.SUBMISSION_CLOSED]: [client_1.CompetitionStatus.EVALUATING],
    [client_1.CompetitionStatus.EVALUATING]: [client_1.CompetitionStatus.COMPLETED],
    [client_1.CompetitionStatus.COMPLETED]: [client_1.CompetitionStatus.ARCHIVED],
    [client_1.CompetitionStatus.ARCHIVED]: [],
};
//# sourceMappingURL=competition-status.enum.js.map
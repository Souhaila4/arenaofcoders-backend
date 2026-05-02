"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_sdk_1 = require("@stream-io/node-sdk");
let StreamService = class StreamService {
    config;
    streamClient = null;
    constructor(config) {
        this.config = config;
        const apiKey = this.config.get('STREAM_API_KEY');
        const apiSecret = this.config.get('STREAM_API_SECRET');
        if (apiKey && apiSecret) {
            this.streamClient = new node_sdk_1.StreamClient(apiKey, apiSecret, {
                timeout: 15000,
            });
        }
    }
    createUserToken(userId) {
        if (!this.streamClient) {
            throw new common_1.BadRequestException('Stream is not configured. Set STREAM_API_KEY and STREAM_API_SECRET in .env');
        }
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new common_1.BadRequestException('userId is required');
        }
        const nowSec = Math.floor(Date.now() / 1000);
        const iat = nowSec - 60;
        const exp = nowSec + 60 * 60;
        return this.streamClient.createToken(userId.trim(), exp, iat);
    }
    getApiKey() {
        return this.config.get('STREAM_API_KEY');
    }
    async ensureArenaMember(userId) {
        if (!this.streamClient) {
            throw new common_1.BadRequestException('Stream is not configured. Set STREAM_API_KEY and STREAM_API_SECRET in .env');
        }
        if (!userId?.trim()) {
            throw new common_1.BadRequestException('userId is required');
        }
        const uid = userId.trim();
        const channel = this.streamClient.chat.channel('messaging', 'arena-live');
        await channel.getOrCreate({
            data: {
                members: [{ user_id: uid }],
                created_by: { id: uid },
            },
        });
        await channel.update({ add_members: [{ user_id: uid }] }).catch(() => {
        });
    }
    async ensureRoomMember(userId, roomId) {
        if (!this.streamClient) {
            throw new common_1.BadRequestException('Stream is not configured. Set STREAM_API_KEY and STREAM_API_SECRET in .env');
        }
        if (!userId?.trim()) {
            throw new common_1.BadRequestException('userId is required');
        }
        const safeRoomId = String(roomId)
            .trim()
            .replace(/[^a-z0-9-_]/gi, '') || 'default-room';
        const uid = userId.trim();
        const channel = this.streamClient.chat.channel('messaging', safeRoomId);
        await channel.getOrCreate({
            data: {
                members: [{ user_id: uid }],
                created_by: { id: uid },
            },
        });
        await channel.update({ add_members: [{ user_id: uid }] }).catch(() => { });
    }
    teamChannelId(equipeId, competitionId) {
        const safeEquipe = equipeId.trim().replace(/[^a-z0-9-_]/gi, '');
        const safeComp = competitionId.trim().replace(/[^a-z0-9-_]/gi, '');
        return `team-${safeEquipe}-comp-${safeComp}`;
    }
    async createTeamChannel(equipeId, competitionId, equipeName, memberIds) {
        if (!this.streamClient) {
            return;
        }
        const channelId = this.teamChannelId(equipeId, competitionId);
        const members = memberIds.map((id) => ({ user_id: id.trim() }));
        const creatorId = memberIds[0]?.trim();
        if (!creatorId)
            return;
        const channel = this.streamClient.chat.channel('messaging', channelId);
        await channel.getOrCreate({
            data: {
                members,
                created_by: { id: creatorId },
            },
        });
        await channel
            .update({ add_members: members })
            .catch(() => { });
    }
    async ensureTeamMember(equipeId, competitionId, userId) {
        if (!this.streamClient)
            return;
        if (!userId?.trim())
            return;
        const channelId = this.teamChannelId(equipeId, competitionId);
        const uid = userId.trim();
        const channel = this.streamClient.chat.channel('messaging', channelId);
        await channel.getOrCreate({
            data: {
                members: [{ user_id: uid }],
                created_by: { id: uid },
            },
        });
        await channel
            .update({ add_members: [{ user_id: uid }] })
            .catch(() => { });
    }
    async archiveTeamChannels(competitionId, equipeIds) {
        if (!this.streamClient)
            return;
        for (const equipeId of equipeIds) {
            try {
                const channelId = this.teamChannelId(equipeId, competitionId);
                const channel = this.streamClient.chat.channel('messaging', channelId);
                await channel.update({
                    set: {
                        frozen: true,
                        name: undefined,
                    },
                });
            }
            catch {
            }
        }
    }
};
exports.StreamService = StreamService;
exports.StreamService = StreamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StreamService);
//# sourceMappingURL=stream.service.js.map
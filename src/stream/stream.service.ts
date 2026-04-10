import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamClient } from '@stream-io/node-sdk';

@Injectable()
export class StreamService {
  private readonly streamClient: StreamClient | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('STREAM_API_KEY');
    const apiSecret = this.config.get<string>('STREAM_API_SECRET');
    if (apiKey && apiSecret) {
      this.streamClient = new StreamClient(apiKey, apiSecret, {
        timeout: 15000, // 15 secondes au lieu de 3 secondes par défaut
      });
    }
  }

  /**
   * Generate a Stream user token for Chat and Video.
   * Token can be used by the client to connect to Stream.
   * iat (issued at) est mis à 60 s dans le passé pour absorber le décalage d'horloge
   * (évite AuthErrorTokenUsedBeforeIssuedAt si le serveur est en avance sur Stream).
   */
  createUserToken(userId: string): string {
    if (!this.streamClient) {
      throw new BadRequestException(
        'Stream is not configured. Set STREAM_API_KEY and STREAM_API_SECRET in .env',
      );
    }
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new BadRequestException('userId is required');
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const iat = nowSec - 60; // 60 s dans le passé pour tolérance clock skew
    const exp = nowSec + 60 * 60; // expiration 1 h
    return this.streamClient.createToken(userId.trim(), exp, iat);
  }

  getApiKey(): string | undefined {
    return this.config.get<string>('STREAM_API_KEY');
  }

  /**
   * Garantit que l'utilisateur est membre du canal arena-live (côté serveur).
   * À appeler avant d'utiliser le chat Arena pour que l'envoi de messages fonctionne.
   */
  async ensureArenaMember(userId: string): Promise<void> {
    if (!this.streamClient) {
      throw new BadRequestException(
        'Stream is not configured. Set STREAM_API_KEY and STREAM_API_SECRET in .env',
      );
    }
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
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
      // Déjà membre ou erreur non bloquante
    });
  }

  /**
   * Garantit que l'utilisateur est membre d'un canal (room) donné.
   * Utilisé pour les salles hackathon : chat + visio + partage d'écran par room.
   */
  async ensureRoomMember(userId: string, roomId: string): Promise<void> {
    if (!this.streamClient) {
      throw new BadRequestException(
        'Stream is not configured. Set STREAM_API_KEY and STREAM_API_SECRET in .env',
      );
    }
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }
    const safeRoomId =
      String(roomId)
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
    await channel.update({ add_members: [{ user_id: uid }] }).catch(() => {});
  }
}

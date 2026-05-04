import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import axios from 'axios';
import FormData = require('form-data');

/**
 * AntiCheatController — Proxy sécurisé vers les Hugging Face Spaces.
 *
 * Le token HuggingFace reste exclusivement côté serveur (.env).
 * Le frontend envoie ses fichiers ici avec son JWT Arena,
 * et le backend les transfère vers HF avec le vrai token.
 */
@ApiTags('anti-cheat')
@Controller('anti-cheat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AntiCheatController {
  private readonly hfToken: string;
  private readonly imageSpaceUrl =
    'https://negzaoui-antiimagesenvirement.hf.space/scan';
  private readonly audioSpaceUrl =
    'https://negzaoui-modelevocal.hf.space/scan-audio';

  constructor(private readonly config: ConfigService) {
    this.hfToken = this.config.get<string>('HUGGINGFACE_TOKEN') ?? '';
  }

  // ─────────────────────────────────────────────────────────────────
  //  POST /anti-cheat/validate-image
  // ─────────────────────────────────────────────────────────────────

  @Post('validate-image')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'avatar', maxCount: 1 },
      ],
      { limits: { fileSize: 10 * 1024 * 1024 } },
    ),
  )
  @ApiConsumes('multipart/form-data')
  /**
   * VÉRIFICATION DE L'ENVIRONNEMENT (Anti-Cheat Image)
   * 
   * Reçoit la photo de l'environnement de travail du participant (Workspace).
   * L'image est transmise de manière sécurisée (Proxy) au modèle Hugging Face de vision (negzaoui-antiimagesenvirement).
   * 
   * Si `avatar` (photo de profil/hackathonFace) est aussi fournie, le modèle peut 
   * optionnellement vérifier si la personne sur la photo correspond au propriétaire du compte.
   * 
   * @param files Contient 'image' (Workspace) et potentiellement 'avatar'
   * @returns Résultat d'analyse de l'IA (Score de confiance, présence d'écrans multiples, etc.)
   */
  @ApiOperation({
    summary:
      'Proxy — Workspace image anti-cheat validation via HuggingFace Space',
  })
  async validateImage(
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
    },
  ) {
    const imageFile = files?.image?.[0];
    if (!imageFile?.buffer) {
      throw new BadRequestException('Image file is required');
    }

    const form = new FormData();
    form.append('image', imageFile.buffer, {
      filename: imageFile.originalname,
      contentType: imageFile.mimetype,
    });

    const avatarFile = files?.avatar?.[0];
    if (avatarFile?.buffer) {
      form.append('avatar', avatarFile.buffer, {
        filename: avatarFile.originalname,
        contentType: avatarFile.mimetype,
      });
    }

    const response = await axios.post(this.imageSpaceUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${this.hfToken}`,
      },
      timeout: 90_000, // 90s — les modèles HF privés prennent 30-45s (+ cold start)
    });

    return response.data;
  }

  // ─────────────────────────────────────────────────────────────────
  //  POST /anti-cheat/validate-audio
  // ─────────────────────────────────────────────────────────────────

  @Post('validate-audio')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'audio', maxCount: 1 }], {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  /**
   * VÉRIFICATION VOCALE (Anti-Cheat Audio)
   * 
   * Reçoit un enregistrement vocal (.wav / .m4a) où le participant explique le code 
   * qu'il a soumis pour le checkpoint.
   * L'audio est transmis au modèle Hugging Face vocal (negzaoui-modelevocal) qui analyse 
   * la pertinence de l'explication vis-à-vis du code fourni.
   * 
   * @param files Contient 'audio' (Enregistrement de la voix du participant)
   * @returns Résultat de validation (Taux de correspondance, retranscription, etc.)
   */
  @ApiOperation({
    summary: 'Proxy — Vocal audio anti-cheat validation via HuggingFace Space',
  })
  async validateAudio(
    @UploadedFiles() files: { audio?: Express.Multer.File[] },
  ) {
    const audioFile = files?.audio?.[0];
    if (!audioFile?.buffer) {
      throw new BadRequestException('Audio file is required');
    }

    const form = new FormData();
    form.append('audio', audioFile.buffer, {
      filename: audioFile.originalname,
      contentType: audioFile.mimetype,
    });

    const response = await axios.post(this.audioSpaceUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${this.hfToken}`,
      },
      timeout: 90_000, // 90s — les modèles HF privés prennent 30-45s (+ cold start)
    });

    return response.data;
  }
}

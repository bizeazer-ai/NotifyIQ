import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
  Res,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { env } from '@notifyiq/config';
import { MessagesService } from './messages.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';
import { QueueService, QueueName } from '../queues/queue.service.js';

const tmpUploadsDir = path.resolve(process.cwd(), 'uploads', 'tmp');
if (!fs.existsSync(tmpUploadsDir)) {
  fs.mkdirSync(tmpUploadsDir, { recursive: true });
}

const uploadStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const unique = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  // Images (Meta max: 5MB)
  'image/jpeg',
  'image/png',
  'image/webp',
  // Audio (Meta max: 16MB)
  'audio/aac',
  'audio/mp4',
  'audio/mpeg',
  'audio/amr',
  'audio/ogg',
  'audio/wav',
  // Video (Meta max: 16MB)
  'video/mp4',
  'video/3gpp',
  // Documents (Platform safe max: 25MB)
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

@Controller('api/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly queueService: QueueService,
  ) {}

  @Post('send')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const workspaceId = req.workspaceId as string;
    const message = await this.messagesService.sendTextMessage(workspaceId, body);
    
    return {
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Post('send-media')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async sendMediaMessage(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const workspaceId = req.workspaceId as string;
    const message = await this.messagesService.sendMediaMessage(workspaceId, body);

    return {
      message: 'Media message dispatched successfully',
      data: message,
    };
  }

  @Post('send-template')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async sendTemplateMessage(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const workspaceId = req.workspaceId as string;
    const message = await this.messagesService.sendTemplateMessage(workspaceId, body);

    return {
      message: 'Template message dispatched successfully',
      data: message,
    };
  }

  @Post('upload')
  @UseGuards(AuthGuard, WorkspaceGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB max document ceiling
      },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Unsupported file format: ${file.mimetype}. WhatsApp allows JPEG, PNG, WebP, MP4, 3GPP, AAC, MP3, OGG, PDF, Word, Excel, PPT, and TXT.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadMedia(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: any,
    @Body() body?: { fileData?: string; filename?: string; mimeType?: string },
  ) {
    const workspaceId = req.workspaceId as string;

    // 1. Multipart Form Data upload (streamed to temp disk and streamed to Meta Cloud API)
    if (file && file.path) {
      const mime = (file.mimetype || '').toLowerCase();
      if (mime.startsWith('image/') && file.size > 5 * 1024 * 1024) {
        await fs.promises.unlink(file.path).catch(() => {});
        throw new BadRequestException('Image exceeds WhatsApp Cloud API limit of 5MB. Please compress the image.');
      }
      if ((mime.startsWith('audio/') || mime.startsWith('video/')) && file.size > 16 * 1024 * 1024) {
        await fs.promises.unlink(file.path).catch(() => {});
        throw new BadRequestException('Audio/Video exceeds WhatsApp Cloud API limit of 16MB.');
      }

      const metaUpload = await this.messagesService.uploadMediaStreamToMeta(
        workspaceId,
        file.path,
        file.originalname,
        file.mimetype,
        file.size,
      );

      return {
        message: 'Media uploaded and streamed directly to Meta Cloud successfully',
        data: {
          mediaId: metaUpload.mediaId,
          url: metaUpload.url,
          metaUrl: metaUpload.metaUrl,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      };
    }

    // 2. Fallback for base64 JSON payloads (streamed to temp file and streamed directly to Meta Cloud API)
    if (body?.fileData) {
      const matches = body.fileData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let mimeType = (body.mimeType || 'application/octet-stream').toLowerCase();
      const base64Data = matches && matches.length === 3 ? matches[2] : body.fileData;
      if (matches && matches.length === 3) {
        mimeType = matches[1].toLowerCase();
      }

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new BadRequestException(`Unsupported file format: ${mimeType}`);
      }

      const ext = path.extname(body.filename || '').toLowerCase() || (mimeType.startsWith('image/') ? '.jpg' : '.bin');
      const tmpPath = path.join(tmpUploadsDir, `b64_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);

      // Stream write to temp file so heap memory can be immediately freed
      await fs.promises.writeFile(tmpPath, Buffer.from(base64Data, 'base64'));
      const stat = await fs.promises.stat(tmpPath);

      if (mimeType.startsWith('image/') && stat.size > 5 * 1024 * 1024) {
        await fs.promises.unlink(tmpPath).catch(() => {});
        throw new BadRequestException('Image exceeds WhatsApp Cloud API limit of 5MB.');
      } else if (mimeType.startsWith('video/') && stat.size > 16 * 1024 * 1024) {
        await fs.promises.unlink(tmpPath).catch(() => {});
        throw new BadRequestException('Video exceeds WhatsApp Cloud API limit of 16MB.');
      } else if (mimeType.startsWith('audio/') && stat.size > 16 * 1024 * 1024) {
        await fs.promises.unlink(tmpPath).catch(() => {});
        throw new BadRequestException('Audio exceeds WhatsApp Cloud API limit of 16MB.');
      } else if (stat.size > 25 * 1024 * 1024) {
        await fs.promises.unlink(tmpPath).catch(() => {});
        throw new BadRequestException('Document exceeds maximum limit of 25MB.');
      }

      const metaUpload = await this.messagesService.uploadMediaStreamToMeta(
        workspaceId,
        tmpPath,
        body.filename || 'attachment',
        mimeType,
        stat.size,
      );

      return {
        message: 'Media uploaded and streamed directly to Meta Cloud successfully',
        data: {
          mediaId: metaUpload.mediaId,
          url: metaUpload.url,
          metaUrl: metaUpload.metaUrl,
          filename: body.filename || 'attachment',
          mimeType,
          size: stat.size,
        },
      };
    }

    throw new BadRequestException('No file or media payload provided');
  }

  @Get('media/file/:filename')
  async getMediaFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = path.basename(filename);
    const legacyPath = path.resolve(process.cwd(), 'uploads', safeFilename);

    if (fs.existsSync(legacyPath)) {
      return res.sendFile(legacyPath);
    }
    throw new NotFoundException('Requested media file not found');
  }

  @Get('media/:mediaId')
  async getProxyMedia(@Param('mediaId') mediaId: string, @Res() res: Response) {
    const isMock = process.env.MOCK_SERVICES === 'true';

    // 1. Fast Cache Check: If already saved locally to disk, serve immediately!
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(uploadDir)) {
      try {
        const files = fs.readdirSync(uploadDir);
        const matchingFile = files.find(
          (f) =>
            f.startsWith(`meta_${mediaId}.`) ||
            f.startsWith(`${mediaId}.`) ||
            f === `meta_${mediaId}` ||
            f === mediaId
        );
        if (matchingFile) {
          const filePath = path.join(uploadDir, matchingFile);
          res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
          return res.sendFile(filePath);
        }
      } catch (err: any) {
        console.warn('[MessagesController] Local media cache check error:', err.message);
      }
    }

    // Mock handling for simulated environments
    if (isMock || mediaId.startsWith('mock_')) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
          <rect width="100%" height="100%" fill="#0f172a" rx="8"/>
          <circle cx="200" cy="100" r="36" fill="#22c55e" opacity="0.2"/>
          <path d="M190 90 L210 100 L190 110 Z" fill="#22c55e"/>
          <text x="200" y="165" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">
            Meta Cloud Media Preview
          </text>
          <text x="200" y="190" fill="#94a3b8" font-family="monospace" font-size="11" text-anchor="middle">
            ID: ${mediaId.slice(0, 24)}
          </text>
        </svg>
      `);
    }

    if (!env.META_ACCESS_TOKEN) {
      return res.status(404).json({ message: 'Media proxy unavailable: Meta access token not configured' });
    }

    try {
      // 2. Fetch direct lookaside URL from Meta Graph API
      const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
      });
      const data = (await metaRes.json()) as any;

      if (data?.url) {
        // 3. Stream media binary directly from Meta's lookaside storage to the client
        const streamRes = await fetch(data.url, {
          headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
        });

        const contentType = streamRes.headers.get('content-type') || data.mime_type || 'application/octet-stream';
        const arrayBuf = await streamRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        // 4. Save to local disk cache for instant subsequent hits
        try {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          let ext = '.bin';
          if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
          else if (contentType.includes('png')) ext = '.png';
          else if (contentType.includes('webp')) ext = '.webp';
          else if (contentType.includes('ogg')) ext = '.ogg';
          else if (contentType.includes('mp4')) ext = '.mp4';
          else if (contentType.includes('mp3')) ext = '.mp3';
          else if (contentType.includes('pdf')) ext = '.pdf';

          fs.writeFileSync(path.join(uploadDir, `meta_${mediaId}${ext}`), buffer);
        } catch (cacheErr: any) {
          console.warn('[MessagesController] Failed to cache media locally:', cacheErr.message);
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // 24-hour browser cache
        return res.send(buffer);
      }
    } catch (err: any) {
      console.warn(`[MessagesController] Proxy media retrieval error: ${err.message}`);
    }

    return res.status(404).json({ message: 'Media not found on Meta Cloud servers' });
  }

  @Get('conversations')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getConversations(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const conversations = await this.messagesService.getConversations(workspaceId);
    
    return {
      message: 'Conversations retrieved successfully',
      data: conversations,
    };
  }

  @Get('history/:conversationId')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getMessageHistory(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Query('limit') limitStr?: string,
    @Query('before') before?: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const messages = await this.messagesService.getMessageHistory(workspaceId, conversationId, limit, before);
    
    return {
      message: 'Messages retrieved successfully',
      data: messages,
      hasMore: messages.length === limit,
    };
  }

  @Post('campaigns/launch')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async launchCampaign(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    const workspaceId = req.workspaceId as string;
    const campaignId = `camp_${Date.now()}`;
    
    await this.queueService.addJob(
      QueueName.CAMPAIGN,
      'execute-campaign',
      {
        campaignId,
        workspaceId,
        templateName: body.templateName,
        contactIds: body.contactIds,
        languageCode: body.languageCode || 'en',
        templateParameters: body.templateParameters,
      }
    );

    return {
      message: 'Campaign queued for high-throughput broadcast successfully',
      data: { campaignId },
    };
  }

  @Get('campaigns/stats')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getCampaignStats(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const stats = await this.messagesService.getCampaignStats(workspaceId);
    
    return {
      message: 'Campaign statistics retrieved successfully',
      data: stats,
    };
  }

  @Post('conversations/:id/toggle-ai')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async toggleAi(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.messagesService.toggleAi(workspaceId, conversationId);
    return {
      message: result.isHumanTakeover ? 'AI auto-reply paused. Human takeover active.' : 'AI auto-reply resumed. Bot active.',
      data: result,
    };
  }

  @Post('conversations/:id/assign')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async assignConversation(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Body('staffId') staffId: string | null,
  ) {
    const workspaceId = req.workspaceId as string;
    const conv = await this.messagesService.assignConversation(workspaceId, conversationId, staffId);
    return {
      message: 'Conversation assignment updated',
      data: conv,
    };
  }

  @Patch('conversations/:id/status')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Body('status') status: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const conv = await this.messagesService.updateConversationStatus(workspaceId, conversationId, status);
    return {
      message: 'Conversation status updated',
      data: conv,
    };
  }
}


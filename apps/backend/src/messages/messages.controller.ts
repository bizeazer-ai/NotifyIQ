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
} from '@nestjs/common';
import type { Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { env } from '@notifyiq/config';
import { MessagesService } from './messages.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';
import { QueueService, QueueName } from '../queues/queue.service.js';

const uploadStorage = memoryStorage();

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

    // 1. Multipart Form Data upload (streamed in-memory directly to Meta Cloud API)
    if (file && file.buffer) {
      const mime = (file.mimetype || '').toLowerCase();
      if (mime.startsWith('image/') && file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Image exceeds WhatsApp Cloud API limit of 5MB. Please compress the image.');
      }
      if ((mime.startsWith('audio/') || mime.startsWith('video/')) && file.size > 16 * 1024 * 1024) {
        throw new BadRequestException('Audio/Video exceeds WhatsApp Cloud API limit of 16MB.');
      }

      const metaUpload = await this.messagesService.uploadMediaToMeta(
        workspaceId,
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      return {
        message: 'Media uploaded directly to Meta Cloud successfully',
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

    // 2. Fallback for base64 JSON payloads (streamed in-memory directly to Meta Cloud API)
    if (body?.fileData) {
      const matches = body.fileData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let buffer: Buffer;
      let mimeType = (body.mimeType || 'application/octet-stream').toLowerCase();

      if (matches && matches.length === 3) {
        mimeType = matches[1].toLowerCase();
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(body.fileData, 'base64');
      }

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new BadRequestException(`Unsupported file format: ${mimeType}`);
      }

      if (mimeType.startsWith('image/') && buffer.length > 5 * 1024 * 1024) {
        throw new BadRequestException('Image exceeds WhatsApp Cloud API limit of 5MB.');
      } else if (mimeType.startsWith('video/') && buffer.length > 16 * 1024 * 1024) {
        throw new BadRequestException('Video exceeds WhatsApp Cloud API limit of 16MB.');
      } else if (mimeType.startsWith('audio/') && buffer.length > 16 * 1024 * 1024) {
        throw new BadRequestException('Audio exceeds WhatsApp Cloud API limit of 16MB.');
      } else if (buffer.length > 25 * 1024 * 1024) {
        throw new BadRequestException('Document exceeds maximum limit of 25MB.');
      }

      const metaUpload = await this.messagesService.uploadMediaToMeta(
        workspaceId,
        buffer,
        body.filename || 'attachment',
        mimeType,
      );

      return {
        message: 'Media uploaded directly to Meta Cloud successfully',
        data: {
          mediaId: metaUpload.mediaId,
          url: metaUpload.url,
          metaUrl: metaUpload.metaUrl,
          filename: body.filename || 'attachment',
          mimeType,
          size: buffer.length,
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
      // 1. Fetch direct lookaside URL from Meta Graph API
      const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
      });
      const data = (await metaRes.json()) as any;

      if (data?.url) {
        // 2. Stream media binary directly from Meta's lookaside storage to the client
        const streamRes = await fetch(data.url, {
          headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
        });

        const contentType = streamRes.headers.get('content-type') || data.mime_type || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // 24-hour browser cache

        const arrayBuf = await streamRes.arrayBuffer();
        return res.send(Buffer.from(arrayBuf));
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
  ) {
    const workspaceId = req.workspaceId as string;
    const messages = await this.messagesService.getMessageHistory(workspaceId, conversationId);
    
    return {
      message: 'Messages retrieved successfully',
      data: messages,
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


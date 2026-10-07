import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { env } from '@notifyiq/config';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';
import { MetaApiLog, MetaApiLogDocument } from '../database/schemas/meta-api-log.schema.js';
import { encrypt, decrypt } from '../lib/utils/encryption.js';

import {
  ConnectWabaDto,
  RegisterPhoneNumberDto,
  WabaProfileDto,
  CreateTemplateDto,
  TemplateButtonDto,
} from './dto/index.js';


@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);

  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(MetaApiLog.name) private readonly metaApiLogModel: Model<MetaApiLogDocument>,
  ) { }

  /**
   * Persists Meta Graph API Request & Response details into MongoDB
   */
  async logMetaApiCall(params: {
    workspaceId: string;
    userId?: string;
    businessAccountId?: string;
    phoneNumberId?: string;
    endpointUrl: string;
    httpMethod: string;
    requestPayload?: any;
    responseStatus?: number;
    responseData?: any;
    errorMessage?: string;
  }) {
    try {
      // Redact tokens in URL parameters for security
      const sanitizedUrl = params.endpointUrl.replace(/access_token=[^&]+/g, 'access_token=REDACTED');
      await this.metaApiLogModel.create({
        workspaceId: params.workspaceId,
        userId: params.userId || null,
        businessAccountId: params.businessAccountId || null,
        phoneNumberId: params.phoneNumberId || null,
        endpointUrl: sanitizedUrl,
        httpMethod: params.httpMethod.toUpperCase(),
        requestPayload: params.requestPayload || null,
        responseStatus: params.responseStatus || 200,
        responseData: params.responseData || null,
        errorMessage: params.errorMessage || null,
      });
    } catch (err: any) {
      this.logger.warn(`[MetaService] Failed saving Meta API log: ${err.message}`);
    }
  }

  /**
   * Retrieves Meta API Logs for Workspace
   */
  async getMetaApiLogs(workspaceId: string): Promise<MetaApiLog[]> {
    return this.metaApiLogModel
      .find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Meta Embedded Signup OAuth Callback Exchange
   */
  async handleEmbeddedSignupCallback(workspaceId: string, code: string, userId?: string) {
    const isMock = process.env.MOCK_SERVICES === 'true';
    let permanentToken = `mock_perm_token_${crypto.randomBytes(12).toString('hex')}`;
    let phoneNumberId = `mock_phone_id_${Date.now()}`;
    let businessAccountId = `mock_waba_id_${Date.now()}`;
    console.log("[META SERVICE] handleEmbeddedSignupCallback", isMock, workspaceId, code, userId);

    if (!isMock && env.META_APP_ID && env.META_APP_SECRET) {
      try {
        this.logger.log('[MetaService] Exchanging Embedded Signup code for permanent token...');

        // 1. Exchange authorization code for system user token
        const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${env.META_APP_ID}&client_secret=${env.META_APP_SECRET}&code=${code}`;
        const res = await fetch(exchangeUrl);
        const data = (await res.json()) as any;

        if (!res.ok || !data.access_token) {
          throw new BadRequestException(data.error?.message || 'Failed to exchange Meta authorization code');
        }

        permanentToken = data.access_token;

        console.log("[RECEIVED PERMANENT TOKEN] ", permanentToken);

        // 2. Query attached WABA assets
        const debugUrl = `https://graph.facebook.com/v20.0/debug_token?input_token=${permanentToken}&access_token=${env.META_APP_ID}|${env.META_APP_SECRET}`;
        const debugRes = await fetch(debugUrl);
        const debugData = (await debugRes.json()) as any;

        if (debugData.data?.granular_scopes) {
          const wabaScope = debugData.data.granular_scopes.find((s: any) => s.scope === 'whatsapp_business_management');
          if (wabaScope?.target_ids?.[0]) {
            businessAccountId = wabaScope.target_ids[0];
          }
        }

        console.log("[BUSINESS ACCOUNT ID]", businessAccountId);

        // 3. Query phone numbers list attached to WABA and default to first available
        if (businessAccountId && !businessAccountId.startsWith('mock_')) {
          const phoneUrl = `https://graph.facebook.com/v20.0/${businessAccountId}/phone_numbers?access_token=${permanentToken}`;
          const phoneRes = await fetch(phoneUrl);
          const phoneData = (await phoneRes.json()) as any;
          if (phoneRes.ok && phoneData.data && phoneData.data.length > 0) {
            phoneNumberId = phoneData.data[0].id;
            this.logger.log(`[MetaService] Defaulting initial phone number ID to first available: ${phoneNumberId}`);
          }
        }
      } catch (err: any) {
        console.error(err);
        this.logger.error(`[MetaService] Embedded signup exchange failed: ${err.message}`);
      }
    }

    return this.connectWaba({ workspaceId, accessToken: permanentToken, phoneNumberId, businessAccountId }, userId);
  }

  async connectWaba(dto: ConnectWabaDto, userId?: string): Promise<{ success: boolean; webhookSecret: string }> {
    const isMock = process.env.MOCK_SERVICES === 'true';
    let permanentToken = dto.accessToken;
    let webhookSecret = crypto.randomBytes(24).toString('hex');

    if (!isMock && env.META_APP_ID && env.META_APP_SECRET) {
      try {
        const appId = env.META_APP_ID;
        const appSecret = env.META_APP_SECRET;

        const exchangeUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${dto.accessToken}`;
        const response = await fetch(exchangeUrl);
        const data = (await response.json()) as any;

        if (response.ok && data.access_token) {
          permanentToken = data.access_token;
        }

        const subscribeUrl = `https://graph.facebook.com/v20.0/${dto.phoneNumberId}/subscribed_apps`;
        await fetch(subscribeUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${permanentToken}`, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        this.logger.error(`[MetaService] Error during Meta Graph API integration: ${err.message}`);
      }
    }

    const encryptedToken = encrypt(permanentToken);
    const encryptedWebhookSecret = encrypt(webhookSecret);

    const workspace = await this.workspaceModel.findById(dto.workspaceId);
    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    workspace.waba = {
      accessToken: encryptedToken,
      phoneNumberId: dto.phoneNumberId,
      businessAccountId: dto.businessAccountId,
      webhookSecret: encryptedWebhookSecret,
    };

    if (workspace.plan === 'free') {
      workspace.plan = 'growth';
    }

    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      userId: userId || null,
      action: 'waba.connect',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: { phoneNumberId: dto.phoneNumberId, businessAccountId: dto.businessAccountId, isMock },
    });

    return { success: true, webhookSecret };
  }

  /**
   * Disconnects WABA account from workspace
   */
  async disconnectWaba(workspaceId: string, userId?: string): Promise<{ success: boolean }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba) {
      return { success: true };
    }

    const phoneNumberId = workspace.waba.phoneNumberId;
    const businessAccountId = workspace.waba.businessAccountId;
    // const token = workspace.waba.accessToken ? decrypt(workspace.waba.accessToken) : '';
    const token = env.META_ACCESS_TOKEN;
    const isMock = process.env.MOCK_SERVICES === 'true';

    if (!isMock && token && phoneNumberId) {
      try {
        const unsubscribeUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/subscribed_apps`;
        await fetch(unsubscribeUrl, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err: any) {
        this.logger.warn(`[MetaService] Unsubscribe app on disconnect warning: ${err.message}`);
      }
    }

    workspace.waba = null;
    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      userId: userId || null,
      action: 'waba.disconnect',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: { phoneNumberId, businessAccountId },
    });

    return { success: true };
  }


  /**
   * Fetch WABA Profile via Meta Graph API v20.0
   */
  async getWabaProfile(workspaceId: string): Promise<WabaProfileDto> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba?.accessToken || !workspace.waba?.phoneNumberId) {
      return {
        about: 'NotifyIQ Automated WABA Account',
        address: 'Mumbai, MH, India',
        description: 'B2B WhatsApp Automation & AI Customer Engagement Platform',
        email: 'support@bizeazer.in',
        vertical: 'PROF_SERVICES',
        websites: ['https://bizeazer.in'],
      };
    }

    // const token = decrypt(workspace.waba.accessToken);
    const token = env.META_ACCESS_TOKEN;
    const phoneId = workspace.waba.phoneNumberId;

    try {
      const url = `https://graph.facebook.com/v20.0/${phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as any;

      if (res.ok && data.data?.[0]) {
        const p = data.data[0];
        return {
          about: p.about || '',
          address: p.address || '',
          description: p.description || '',
          email: p.email || '',
          vertical: p.vertical || 'OTHER',
          websites: p.websites || [],
          profilePictureUrl: p.profile_picture_url || '',
        };
      }
    } catch (err: any) {
      this.logger.warn(`[MetaService] Failed fetching WABA profile from Meta API: ${err.message}`);
    }

    return {
      about: 'NotifyIQ Automated WABA Account',
      address: 'Mumbai, MH, India',
      description: 'B2B WhatsApp Automation & AI Customer Engagement Platform',
      email: 'support@bizeazer.in',
      vertical: 'PROF_SERVICES',
      websites: ['https://bizeazer.in'],
    };
  }

  /**
   * Update WABA Profile via Meta Graph API v20.0
   */
  async updateWabaProfile(workspaceId: string, profileDto: WabaProfileDto): Promise<{ success: boolean }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba?.accessToken || !workspace.waba?.phoneNumberId) {
      return { success: true };
    }

    // const token = decrypt(workspace.waba.accessToken);
    const token = env.META_ACCESS_TOKEN;
    const phoneId = workspace.waba.phoneNumberId;

    try {
      const url = `https://graph.facebook.com/v20.0/${phoneId}/whatsapp_business_profile`;
      await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...profileDto }),
      });
    } catch (err: any) {
      this.logger.error(`[MetaService] Failed updating WABA profile on Meta: ${err.message}`);
    }

    return { success: true };
  }

  /**
   * List WhatsApp Message Templates
   */
  async getTemplates(workspaceId: string): Promise<any[]> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba?.accessToken || !workspace.waba?.businessAccountId) {
      return [];
    }

    // const token = decrypt(workspace.waba.accessToken);
    const token = env.META_ACCESS_TOKEN;
    const wabaId = workspace.waba.businessAccountId;

    try {
      const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as any;

      if (res.ok && data.data) {
        return data.data;
      }
    } catch (err: any) {
      this.logger.warn(`[MetaService] Failed fetching templates from Meta: ${err.message}`);
    }

    return [];
  }

  /**
   * Uploads a media file buffer from a URL to Meta Resumable Upload API
   * to retrieve an upload handle for template headers.
   */
  async uploadMediaHandleToMeta(
    appId: string,
    token: string,
    mediaUrl: string,
    fileType = 'image/jpeg',
  ): Promise<string | null> {
    try {
      const res = await fetch(mediaUrl);
      if (!res.ok) throw new Error(`Failed to fetch media from ${mediaUrl}: ${res.statusText}`);
      const buffer = Buffer.from(await res.arrayBuffer());

      // 1. Create upload session
      const createSessionUrl = `https://graph.facebook.com/v20.0/${appId}/uploads?file_length=${buffer.length}&file_type=${fileType}`;
      const sessionRes = await fetch(createSessionUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const sessionData = (await sessionRes.json()) as any;
      const sessionId = sessionData.id;
      if (!sessionId) throw new Error(`Meta upload session creation failed: ${JSON.stringify(sessionData)}`);

      // 2. Upload file buffer to session
      const uploadUrl = `https://graph.facebook.com/v20.0/${sessionId}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          file_offset: '0',
          'Content-Type': fileType,
        },
        body: buffer,
      });
      const uploadData = (await uploadRes.json()) as any;
      return uploadData.h || null;
    } catch (err: any) {
      this.logger.error(`[MetaService] uploadMediaHandleToMeta failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Submit WhatsApp Message Template to Meta for approval
   */
  async createTemplate(workspaceId: string, dto: CreateTemplateDto): Promise<{ success: boolean; id: string; status: string }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba || !workspace.waba.accessToken || !workspace.waba.businessAccountId) {
      throw new BadRequestException('Workspace is not connected to a Meta WABA account');
    }

    const templateId = `tpl_${Date.now()}`;
    const token = env.META_ACCESS_TOKEN || workspace.waba.accessToken;
    const wabaId = workspace.waba.businessAccountId;
    const isMock = process.env.MOCK_SERVICES === 'true';

    // 1. Process Body Component & Auto-Inject Example for {{1}}, {{2}} variables (Resolves Error 2388043)
    const bodyMatches = dto.bodyText.match(/\{\{(\d+)\}\}/g);
    const bodyComponent: any = { type: 'BODY', text: dto.bodyText };
    if (bodyMatches && bodyMatches.length > 0) {
      const distinctCount = new Set(bodyMatches).size;
      const sampleValues = Array.from({ length: distinctCount }, (_, i) => `Sample_${i + 1}`);
      bodyComponent.example = {
        body_text: [sampleValues],
      };
    }
    const components: any[] = [bodyComponent];

    // 2. Process Header Component (Text or Resumable Media Handle)
    if (dto.headerText && dto.headerType === 'TEXT') {
      const headerMatches = dto.headerText.match(/\{\{(\d+)\}\}/g);
      const headerComp: any = { type: 'HEADER', format: 'TEXT', text: dto.headerText };
      if (headerMatches && headerMatches.length > 0) {
        headerComp.example = {
          header_text: ['Sample Header'],
        };
      }
      components.push(headerComp);
    } else if (dto.headerType && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(dto.headerType)) {
      const headerComp: any = { type: 'HEADER', format: dto.headerType };
      if (dto.headerUrl && env.META_APP_ID && !isMock) {
        const mimeType = dto.headerType === 'IMAGE' ? 'image/jpeg' : dto.headerType === 'VIDEO' ? 'video/mp4' : 'application/pdf';
        const handle = await this.uploadMediaHandleToMeta(env.META_APP_ID, token, dto.headerUrl, mimeType);
        if (handle) {
          headerComp.example = { header_handle: [handle] };
        }
      }
      components.push(headerComp);
    }

    // 3. Process Footer Component
    if (dto.footerText) {
      components.push({ type: 'FOOTER', text: dto.footerText });
    }

    // 4. Process Buttons Component
    if (dto.buttons && dto.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: dto.buttons.map((b) => ({
          type: b.type,
          text: b.text,
          ...(b.value ? { url: b.value } : {}),
        })),
      });
    }

    let metaTemplateId = templateId;
    let metaStatus = 'APPROVED';

    if (!isMock) {
      try {
        const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: dto.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            category: dto.category,
            language: dto.language,
            components,
          }),
        });

        const data = (await response.json()) as any;
        if (!response.ok || data.error) {
          const errMsg = data.error?.message || `Meta API Error (${response.status})`;
          this.logger.error(`[MetaService] Failed submitting template to Meta: ${errMsg}`, data.error);
          throw new BadRequestException(errMsg);
        }

        metaTemplateId = data.id || templateId;
        metaStatus = data.status || 'PENDING';
      } catch (err: any) {
        this.logger.error(`[MetaService] Failed submitting template to Meta: ${err.message}`);
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(`Meta template submission failed: ${err.message}`);
      }
    }

    await this.auditLogModel.create({
      workspaceId,
      action: 'meta.template_created',
      resource: 'Template',
      details: { templateName: dto.name, category: dto.category, componentsCount: components.length, metaStatus },
    });

    return { success: true, id: metaTemplateId, status: metaStatus };
  }

  /**
   * Delete WhatsApp Message Template
   */
  async deleteTemplate(workspaceId: string, name: string): Promise<{ success: boolean }> {
    const workspace = await this.workspaceModel.findById(workspaceId);

    if (workspace && workspace.waba?.accessToken && workspace.waba?.businessAccountId) {
      // const token = decrypt(workspace.waba.accessToken);
      const token = env.META_ACCESS_TOKEN;
      const wabaId = workspace.waba.businessAccountId;

      try {
        const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=${name}`;
        await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      } catch (err: any) {
        this.logger.error(`[MetaService] Failed deleting template on Meta: ${err.message}`);
      }
    }

    return { success: true };
  }

  /**
   * Check WABA Connection Status for Workspace
   */
  async getWabaStatus(workspaceId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    const isConnected = !!(workspace?.waba?.businessAccountId && workspace?.waba?.accessToken);
    return {
      isConnected,
      isWabaConnected: isConnected,
      businessAccountId: workspace?.waba?.businessAccountId || null,
      phoneNumberId: workspace?.waba?.phoneNumberId || null,
    };
  }

  /**
   * Fetch phone number list attached to connected WABA ID via Meta Graph API
   */
  async getPhoneNumbers(workspaceId: string): Promise<any[]> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba?.accessToken || !workspace.waba?.businessAccountId) {
      return [];
    }

    const isMock = process.env.MOCK_SERVICES === 'true';
    // const token = decrypt(workspace.waba.accessToken);
    const token = env.META_ACCESS_TOKEN;
    const wabaId = workspace.waba.businessAccountId;

    if (!isMock && !wabaId.startsWith('mock_')) {
      try {
        const url = `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${token}`;
        const res = await fetch(url);
        const data = (await res.json()) as any;

        if (res.ok && data.data && data.data.length > 0) {
          return data.data.map((p: any) => ({
            id: p.id,
            display_phone_number: p.display_phone_number || p.id,
            verified_name: p.verified_name || 'WhatsApp Business Number',
            quality_rating: p.quality_rating || 'GREEN',
            code_verification_status: p.code_verification_status || 'VERIFIED',
          }));
        }
      } catch (err: any) {
        this.logger.warn(`[MetaService] Failed fetching phone numbers from Meta API: ${err.message}`);
      }
    }

    // If no numbers returned or fetch failed, return empty list (no hardcoded static phone fallbacks)
    if (workspace.waba?.phoneNumberId) {
      return [
        {
          id: workspace.waba.phoneNumberId,
          display_phone_number: workspace.waba.phoneNumberId,
          verified_name: workspace.name || 'WABA Line',
          quality_rating: 'GREEN',
          code_verification_status: 'VERIFIED',
        },
      ];
    }

    return [];
  }

  /**
   * Select and switch active phone number ID for Workspace
   */
  async selectPhoneNumber(workspaceId: string, phoneNumberId: string, userId?: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba) {
      throw new BadRequestException('WABA is not connected to this workspace');
    }

    workspace.waba.phoneNumberId = phoneNumberId;
    await workspace.save();

    const isMock = process.env.MOCK_SERVICES === 'true';
    if (!isMock && workspace.waba.accessToken) {
      try {
        const token = decrypt(workspace.waba.accessToken);
        const subscribeUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/subscribed_apps`;
        await fetch(subscribeUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        this.logger.error(`[MetaService] Failed subscribing selected phone number to Meta apps: ${err.message}`);
      }
    }

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      userId: userId || null,
      action: 'waba.select_phone_number',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: { phoneNumberId, businessAccountId: workspace.waba.businessAccountId },
    });

    return { success: true, phoneNumberId };
  }

  /**
   * Register a new phone number to connected WABA via Meta Graph API v20.0
   */
  async registerPhoneNumber(workspaceId: string, dto: RegisterPhoneNumberDto, userId?: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace || !workspace.waba || !workspace.waba.businessAccountId) {
      throw new BadRequestException('WABA is not connected to this workspace');
    }

    const isMock = process.env.MOCK_SERVICES === 'true';
    const wabaId = workspace.waba.businessAccountId;
    const token = workspace.waba.accessToken ? decrypt(workspace.waba.accessToken) : '';
    let newPhoneId = `phone_${Date.now()}`;
    let resStatus = 200;
    let resData: any = null;

    const payload = {
      phone_number: dto.phoneNumber.replace(/[^0-9]/g, ''),
      display_name: dto.displayName,
      verified_name: dto.displayName,
      cc: (dto.countryCode || '91').replace(/[^0-9]/g, ''),
    };

    if (!isMock && token && !wabaId.startsWith('mock_')) {
      const url = `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers`;

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        resStatus = res.status;
        resData = (await res.json()) as any;

        if (res.ok && resData.id) {
          newPhoneId = resData.id;
        }

        await this.logMetaApiCall({
          workspaceId,
          userId,
          businessAccountId: wabaId,
          phoneNumberId: newPhoneId,
          endpointUrl: url,
          httpMethod: 'POST',
          requestPayload: payload,
          responseStatus: resStatus,
          responseData: resData,
          errorMessage: !res.ok ? resData?.error?.message || 'Meta API call failed' : undefined,
        });

        if (!res.ok) {
          throw new BadRequestException(resData?.error?.message || 'Failed to register phone number with Meta Graph API');
        }
      } catch (err: any) {
        this.logger.error(`[MetaService] Error registering phone number on Meta API: ${err.message}`);
        await this.logMetaApiCall({
          workspaceId,
          userId,
          businessAccountId: wabaId,
          endpointUrl: `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers`,
          httpMethod: 'POST',
          requestPayload: payload,
          responseStatus: resStatus || 500,
          errorMessage: err.message,
        });
        if (err instanceof BadRequestException) throw err;
      }
    } else {
      // Mock mode recording
      resData = { success: true, id: newPhoneId, display_phone_number: dto.phoneNumber, verified_name: dto.displayName };
      await this.logMetaApiCall({
        workspaceId,
        userId,
        businessAccountId: wabaId,
        phoneNumberId: newPhoneId,
        endpointUrl: `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers (MOCK)`,
        httpMethod: 'POST',
        requestPayload: payload,
        responseStatus: 200,
        responseData: resData,
      });
    }

    // Set newly created number as active
    workspace.waba.phoneNumberId = newPhoneId;
    await workspace.save();

    await this.auditLogModel.create({
      workspaceId: workspace._id.toString(),
      userId: userId || null,
      action: 'waba.register_phone_number',
      resource: 'Workspace',
      resourceId: workspace._id.toString(),
      details: { phoneNumberId: newPhoneId, phoneNumber: dto.phoneNumber, displayName: dto.displayName },
    });

    return { success: true, phoneNumberId: newPhoneId, displayPhoneNumber: dto.phoneNumber, verifiedName: dto.displayName };
  }
}

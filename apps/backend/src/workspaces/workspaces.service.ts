import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import dns from 'dns';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async getAutoReplySettings(workspaceId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    return workspace.autoReplySettings || {
      enabled: false,
      systemPrompt: 'You are NotifyIQ AI assistant. Answer customer questions concisely and politely using only the provided knowledge base context.',
      confidenceThreshold: 0.70,
      fallbackToHuman: true,
      outOfHoursOnly: false,
      operatingHours: { enabled: false, timezone: 'Asia/Kolkata', workDays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
      outOfHoursMessage: 'Thank you for reaching out! Our support team is currently offline. We will respond during business hours.',
    };
  }

  async updateAutoReplySettings(workspaceId: string, settings: any) {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');

    workspace.autoReplySettings = {
      ...workspace.autoReplySettings,
      ...settings,
    };

    workspace.markModified('autoReplySettings');
    await workspace.save();

    return workspace.autoReplySettings;
  }

  /**
   * Updates whitelabel branding properties for the active workspace
   */
  async updateWhitelabelBranding(
    workspaceId: string,
    dto: { logoUrl?: string; brandColor?: string; customCss?: string; customDomain?: string },
  ): Promise<Workspace> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (!workspace.whitelabel) {
      workspace.whitelabel = {};
    }

    if (dto.logoUrl !== undefined) workspace.whitelabel.logoUrl = dto.logoUrl;
    if (dto.brandColor !== undefined) workspace.whitelabel.brandColor = dto.brandColor;
    if (dto.customCss !== undefined) workspace.whitelabel.customCss = dto.customCss;
    if (dto.customDomain !== undefined) {
      workspace.whitelabel.customDomain = dto.customDomain.toLowerCase().trim();
    }

    workspace.markModified('whitelabel');
    await workspace.save();

    console.log(`[WorkspacesService] Updated whitelabel branding for workspace: ${workspaceId}`);
    return workspace;
  }

  /**
   * Resolves cascading whitelabel settings.
   */
  async resolveBranding(workspaceId: string): Promise<any> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.whitelabel && (workspace.whitelabel.logoUrl || workspace.whitelabel.brandColor)) {
      return {
        logoUrl: workspace.whitelabel.logoUrl || null,
        brandColor: workspace.whitelabel.brandColor || null,
        customCss: workspace.whitelabel.customCss || null,
        customDomain: workspace.whitelabel.customDomain || null,
        isSubAccountFallback: false,
      };
    }

    const parentAgencyId = workspace.whitelabel?.parentAgencyId;
    if (parentAgencyId) {
      const parent = await this.workspaceModel.findById(parentAgencyId);
      if (parent && parent.whitelabel) {
        return {
          logoUrl: parent.whitelabel.logoUrl || null,
          brandColor: parent.whitelabel.brandColor || null,
          customCss: parent.whitelabel.customCss || null,
          customDomain: parent.whitelabel.customDomain || null,
          isSubAccountFallback: true,
          parentAgencyName: parent.name,
        };
      }
    }

    return {
      logoUrl: null,
      brandColor: '#a855f7',
      customCss: null,
      customDomain: null,
      isSubAccountFallback: false,
    };
  }

  /**
   * Resolves workspace details by custom domain.
   */
  async resolveByDomain(domain: string): Promise<any> {
    const cleanDomain = domain.toLowerCase().trim();
    const workspace = await this.workspaceModel.findOne({ 'whitelabel.customDomain': cleanDomain });
    if (!workspace) {
      throw new NotFoundException(`No workspace registered for domain: ${cleanDomain}`);
    }

    const branding = await this.resolveBranding(workspace._id.toString());
    return {
      workspaceId: workspace._id,
      workspaceName: workspace.name,
      slug: workspace.slug,
      branding,
    };
  }

  /**
   * Performs real-time CNAME verification checks against the target domain.
   * If valid, updates workspace's customDomain setting.
   */
  async verifyCustomDomainCname(workspaceId: string, domain: string): Promise<{ success: boolean; cnameTargets: string[] }> {
    const cleanDomain = domain.toLowerCase().trim();
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    console.log(`[WorkspacesService] Verifying CNAME mapping for ${cleanDomain} (Workspace ${workspaceId})...`);

    const isMock = process.env.MOCK_SERVICES === 'true';
    let success = false;
    let resolvedCnames: string[] = [];

    if (!isMock) {
      try {
        resolvedCnames = await dns.promises.resolveCname(cleanDomain);
        const targetPattern = /cname\.notifyiq\.app|notifyiq\.app/i;
        success = resolvedCnames.some((target) => targetPattern.test(target));
      } catch (err: any) {
        console.warn(`[WorkspacesService] DNS CNAME resolution failed for ${cleanDomain}:`, err.message);
        success = false;
      }
    } else {
      success = true;
      resolvedCnames = ['cname.notifyiq.app'];
    }

    if (success) {
      if (!workspace.whitelabel) workspace.whitelabel = {};
      workspace.whitelabel.customDomain = cleanDomain;
      workspace.markModified('whitelabel');
      await workspace.save();

      await this.auditLogModel.create({
        workspaceId,
        action: 'workspace.cname_verified',
        resource: 'Workspace',
        resourceId: workspaceId,
        details: {
          customDomain: cleanDomain,
          resolvedCnames,
          status: 'success',
        },
      });
    } else {
      throw new BadRequestException(`CNAME validation failed for ${cleanDomain}. Ensure it points to cname.notifyiq.app`);
    }

    return {
      success: true,
      cnameTargets: resolvedCnames,
    };
  }
}

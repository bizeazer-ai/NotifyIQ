import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@notifyiq/config';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';
import { Workspace, WorkspaceDocument } from '../database/schemas/workspace.schema.js';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
  ) {}

  /**
   * Cascading DPDP Deletion Pipeline
   */
  async processContactDeletion(workspaceId: string, contactId: string, userId?: string): Promise<{ success: boolean; messagesDeleted: number }> {
    const contact = await this.contactModel.findOne({ _id: contactId, workspaceId });
    if (!contact) {
      throw new NotFoundException('Contact not found in this workspace');
    }

    console.log(`[ComplianceService] Starting DPDP erasure request for contact ${contact.phone} in workspace ${workspaceId}`);

    const rawPhone = contact.phone;
    let anonymizedPhone = rawPhone;
    if (rawPhone.length > 8) {
      anonymizedPhone = `${rawPhone.substring(0, 5)}****${rawPhone.substring(rawPhone.length - 4)}`;
    }

    const conversations = await this.conversationModel.find({ contactId: contact._id.toString(), workspaceId });
    const conversationIds = conversations.map((conv) => conv._id.toString());

    const messageDeleteResult = await this.messageModel.deleteMany({
      conversationId: { $in: conversationIds },
      workspaceId,
    });

    await this.conversationModel.deleteMany({
      contactId: contact._id.toString(),
      workspaceId,
    });

    await this.contactModel.deleteOne({ _id: contact._id.toString(), workspaceId });

    await this.auditLogModel.create({
      workspaceId,
      userId: userId || null,
      action: 'compliance.erasure',
      resource: 'Contact',
      resourceId: contactId,
      details: {
        anonymizedPhone,
        messagesDeleted: messageDeleteResult.deletedCount,
        complianceStandard: 'DPDP Act 2023 / GDPR Art 17',
      },
    });

    return {
      success: true,
      messagesDeleted: messageDeleteResult.deletedCount,
    };
  }

  /**
   * GDPR Data Portability Export Pipeline (Article 20 Data Portability)
   * Generates a zip archive containing CSVs and JSONs, uploads it to S3, and returns a signed 24h link.
   */
  async generateExport(workspaceId: string, userId?: string): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const workspace = await this.workspaceModel.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    console.log(`[ComplianceService] Generating compliance data export for workspace: ${workspaceId}`);

    // 1. Gather all collections scoped to workspace
    const contacts = await this.contactModel.find({ workspaceId }).lean();
    const conversations = await this.conversationModel.find({ workspaceId }).lean();
    const messages = await this.messageModel.find({ workspaceId }).lean();
    const auditLogs = await this.auditLogModel.find({ workspaceId }).lean();

    // 2. Prepare JSON metadata files
    const workspaceInfo = {
      id: workspace._id,
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.type,
      plan: workspace.plan,
      currency: workspace.currency,
      complianceSettings: workspace.compliance,
      createdAt: (workspace as any).createdAt,
    };

    // 3. Convert tabular data to CSV strings
    const contactsCsv = this.jsonToCsv(contacts, ['_id', 'name', 'phone', 'consentGiven', 'optedOut', 'createdAt']);
    const auditLogsCsv = this.jsonToCsv(auditLogs, ['_id', 'action', 'resource', 'resourceId', 'ipAddress', 'createdAt']);

    // 4. Create ZIP stream archive
    const tempDir = path.join(process.cwd(), 'temp', 'exports');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const zipFileName = `${workspace.slug}_export_${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);

    const output = fs.createWriteStream(zipPath);
    const archive = (archiver as any)('zip', { zlib: { level: 9 } });

    const archivePromise = new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));
    });

    archive.pipe(output);

    // Append JSONs and CSVs
    archive.append(JSON.stringify(workspaceInfo, null, 2), { name: 'workspace_info.json' });
    archive.append(contactsCsv, { name: 'contacts.csv' });
    archive.append(JSON.stringify(conversations, null, 2), { name: 'conversations.json' });
    archive.append(JSON.stringify(messages, null, 2), { name: 'messages.json' });
    archive.append(auditLogsCsv, { name: 'audit_log.csv' });

    // Dummy campaigns configuration file for schema compliance
    archive.append(JSON.stringify([], null, 2), { name: 'campaigns.json' });

    await archive.finalize();
    await archivePromise;

    const isMock = process.env.MOCK_SERVICES === 'true' || !env.UTHO_ACCESS_KEY;
    let downloadUrl = '';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

    if (!isMock) {
      try {
        console.log('[ComplianceService] Uploading ZIP archive to Utho Object Storage (S3)...');
        const s3 = new S3Client({
          endpoint: env.UTHO_ENDPOINT || 'https://sos.utho.com', // Utho storage endpoint
          region: 'ap-south-1',
          credentials: {
            accessKeyId: env.UTHO_ACCESS_KEY || '',
            secretAccessKey: env.UTHO_SECRET_KEY || '',
          },
          forcePathStyle: true,
        });

        const fileStream = fs.createReadStream(zipPath);
        const bucket = env.UTHO_BUCKET || 'notifyiq-exports';

        // Upload object
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: zipFileName,
            Body: fileStream,
            ContentType: 'application/zip',
          })
        );

        // Generate 24-hour presigned URL
        const command = new PutObjectCommand({ Bucket: bucket, Key: zipFileName });
        downloadUrl = await getSignedUrl(s3, command, { expiresIn: 86400 });

        // Clean up local temp file asynchronously
        fs.unlink(zipPath, (err) => {
          if (err) console.error('[ComplianceService] Local temp cleanup error:', err);
        });
      } catch (err) {
        console.error('[ComplianceService] Failed to upload export archive to S3. Falling back to local URL. Error:', err.message);
        downloadUrl = `/api/compliance/download/${zipFileName}`;
      }
    } else {
      // Setup local download URL mapping
      downloadUrl = `/api/compliance/download/${zipFileName}`;
      console.log(`[ComplianceService] Mock Mode. Generated local download URL: ${downloadUrl}`);
    }

    // Append AuditLog audit trail event for compliance
    await this.auditLogModel.create({
      workspaceId,
      userId: userId || null,
      action: 'compliance.export',
      resource: 'Workspace',
      resourceId: workspaceId,
      details: {
        zipFileName,
        isMock,
        complianceStandard: 'GDPR Article 20 / DPDP Act Section 11',
      },
    });

    return {
      downloadUrl,
      expiresAt,
    };
  }

  async getContacts(workspaceId: string): Promise<ContactDocument[]> {
    return this.contactModel.find({ workspaceId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Helper utility to format raw JSON records into a CSV string
   */
  private jsonToCsv(items: any[], headers: string[]): string {
    const headerLine = headers.join(',');
    const rowLines = items.map((item) => {
      return headers
        .map((header) => {
          const val = item[header] === undefined || item[header] === null ? '' : item[header];
          const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          // Escape quotes
          return `"${strVal.replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    return [headerLine, ...rowLines].join('\n');
  }
}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema.js';

export class CreateContactDto {
  name: string;
  phone: string;
  tags?: string[];
  consentGiven?: boolean;
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async getContacts(workspaceId: string, search?: string, tag?: string) {
    const query: any = { workspaceId };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { phone: regex }];
    }
    if (tag) {
      query.tags = tag;
    }

    return this.contactModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async createContact(workspaceId: string, dto: CreateContactDto) {
    const rawPhone = dto.phone.trim();
    const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;

    const existing = await this.contactModel.findOne({ workspaceId, phone });
    if (existing) {
      throw new BadRequestException(`Contact with phone ${phone} already exists in workspace`);
    }

    const contact = await this.contactModel.create({
      workspaceId,
      name: dto.name.trim(),
      phone,
      tags: dto.tags || ['Customer'],
      consentGiven: dto.consentGiven !== undefined ? dto.consentGiven : true,
    });

    return contact;
  }

  async bulkImportCsv(workspaceId: string, csvContent: string) {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    let createdCount = 0;
    let skippedCount = 0;

    const rows = lines.slice(lines[0]!.toLowerCase().includes('phone') ? 1 : 0);

    for (const row of rows) {
      const parts = row.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 2) continue;

      const name = parts[0] || 'Imported Contact';
      const rawPhone = parts[1] || '';
      const tagStr = parts[2] || 'Lead';

      if (!rawPhone || rawPhone.length < 8) {
        skippedCount++;
        continue;
      }

      const phone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
      const existing = await this.contactModel.findOne({ workspaceId, phone });

      if (!existing) {
        await this.contactModel.create({
          workspaceId,
          name,
          phone,
          tags: [tagStr],
          consentGiven: true,
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    await this.auditLogModel.create({
      workspaceId,
      action: 'contact.bulk_import',
      resource: 'Contact',
      details: { createdCount, skippedCount, totalRows: rows.length },
    });

    return { createdCount, skippedCount, totalProcessed: rows.length };
  }

  async exportContactsCsv(workspaceId: string): Promise<string> {
    const contacts = await this.contactModel.find({ workspaceId }).sort({ createdAt: -1 });

    const header = 'Name,Phone,Tags,Consent,CreatedAt\n';
    const rows = contacts.map((c) =>
      `"${c.name}","${c.phone}","${(c.tags || []).join(';')}",${c.consentGiven},"${c.createdAt}"`
    );

    return header + rows.join('\n');
  }

  async deleteContact(workspaceId: string, contactId: string) {
    const res = await this.contactModel.deleteOne({ _id: contactId, workspaceId });
    if (res.deletedCount === 0) {
      throw new NotFoundException('Contact not found');
    }
    return { success: true };
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractedLead, ExtractedLeadDocument, LeadStatus } from '../database/schemas/extracted-lead.schema.js';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';
import { SocketGateway } from '../socket/socket.gateway.js';
import { OutboundWebhookDispatcher } from '../outbound-webhooks/outbound-webhook.dispatcher.js';

export interface UserDetailsDto {
  name?: string;
  email?: string;
  category?: string;
  budget?: string;
  productInterest?: string;
}

@Injectable()
export class LeadExtractionService {
  private readonly logger = new Logger(LeadExtractionService.name);

  constructor(
    @InjectModel(ExtractedLead.name) private readonly extractedLeadModel: Model<ExtractedLeadDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    private readonly socketGateway: SocketGateway,
    private readonly dispatcher: OutboundWebhookDispatcher,
  ) {}

  /**
   * Upsert extracted lead information from AI RAG parsing or chat interactions.
   */
  async processExtractedLead(
    workspaceId: string,
    contactId: string,
    contactPhone: string,
    userDetails: UserDetailsDto,
    rawNotes?: string,
    confidence = 0.85,
  ): Promise<ExtractedLeadDocument | null> {
    if (!userDetails || Object.keys(userDetails).length === 0) {
      return null;
    }

    // Check if at least one meaningful field exists
    const hasData =
      userDetails.name ||
      userDetails.email ||
      userDetails.category ||
      userDetails.budget ||
      userDetails.productInterest;

    if (!hasData) {
      return null;
    }

    this.logger.log(
      `[LeadExtraction] Processing lead details for ${contactPhone} in workspace ${workspaceId}: ${JSON.stringify(userDetails)}`,
    );

    const updateFields: any = {
      extractedAt: new Date(),
      confidence,
    };
    if (userDetails.name) updateFields.name = userDetails.name.trim();
    if (userDetails.email) updateFields.email = userDetails.email.trim();
    if (userDetails.category) updateFields.category = userDetails.category.trim();
    if (userDetails.budget) updateFields.budget = userDetails.budget.trim();
    if (userDetails.productInterest) updateFields.productInterest = userDetails.productInterest.trim();
    if (rawNotes) updateFields.rawNotes = rawNotes.trim();

    const lead = await this.extractedLeadModel.findOneAndUpdate(
      { workspaceId, contactPhone },
      {
        $set: updateFields,
        $setOnInsert: {
          workspaceId,
          contactId,
          contactPhone,
          status: 'new',
        },
      },
      { upsert: true, new: true },
    );

    // Sync updates back to the Contact document
    try {
      const contact = await this.contactModel.findById(contactId);
      if (contact) {
        let contactUpdated = false;
        if (
          userDetails.name &&
          (!contact.name || contact.name === 'Unknown' || contact.name.trim() === '')
        ) {
          contact.name = userDetails.name.trim();
          contactUpdated = true;
        }

        if (userDetails.category) {
          contact.tags = contact.tags || [];
          if (!contact.tags.includes(userDetails.category.trim())) {
            contact.tags.push(userDetails.category.trim());
            contactUpdated = true;
          }
        }

        if (userDetails.productInterest) {
          contact.tags = contact.tags || [];
          if (!contact.tags.includes(userDetails.productInterest.trim())) {
            contact.tags.push(userDetails.productInterest.trim());
            contactUpdated = true;
          }
        }

        if (contactUpdated) {
          await contact.save();
        }
      }
    } catch (err: any) {
      this.logger.warn(`[LeadExtraction] Failed to sync contact fields: ${err.message}`);
    }

    // Real-time broadcast to inbox & frontend
    this.socketGateway.emitToWorkspace(workspaceId, 'lead.updated', {
      leadId: lead._id.toString(),
      contactId,
      contactPhone,
      status: lead.status,
      category: lead.category,
      name: lead.name,
      email: lead.email,
      budget: lead.budget,
      productInterest: lead.productInterest,
      confidence: lead.confidence,
    });

    // Outbound webhook notification
    this.dispatcher
      .dispatchEvent(workspaceId, 'lead.status_changed', {
        lead: {
          id: lead._id.toString(),
          contactPhone,
          status: lead.status,
          category: lead.category,
          name: lead.name,
          email: lead.email,
          budget: lead.budget,
          productInterest: lead.productInterest,
        },
        contact: {
          id: contactId,
          phone: contactPhone,
        },
      })
      .catch((err) =>
        this.logger.error(`[LeadExtraction] Outbound webhook dispatch failed: ${err.message}`),
      );

    return lead;
  }

  async getLeads(
    workspaceId: string,
    query?: { status?: string; category?: string; search?: string },
  ) {
    const filter: any = { workspaceId };
    if (query?.status) {
      filter.status = query.status;
    }
    if (query?.category) {
      filter.category = query.category;
    }
    if (query?.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: regex },
        { contactPhone: regex },
        { productInterest: regex },
        { email: regex },
      ];
    }

    return this.extractedLeadModel.find(filter).sort({ updatedAt: -1 }).exec();
  }

  async getLeadByPhone(workspaceId: string, contactPhone: string) {
    return this.extractedLeadModel.findOne({ workspaceId, contactPhone }).exec();
  }

  async updateLead(
    workspaceId: string,
    leadId: string,
    dto: {
      status?: LeadStatus;
      category?: string;
      budget?: string;
      productInterest?: string;
      rawNotes?: string;
    },
  ) {
    const lead = await this.extractedLeadModel.findOne({ _id: leadId, workspaceId });
    if (!lead) {
      throw new NotFoundException('Extracted lead not found');
    }

    if (dto.status) lead.status = dto.status;
    if (dto.category !== undefined) lead.category = dto.category;
    if (dto.budget !== undefined) lead.budget = dto.budget;
    if (dto.productInterest !== undefined) lead.productInterest = dto.productInterest;
    if (dto.rawNotes !== undefined) lead.rawNotes = dto.rawNotes;

    await lead.save();

    // Also update contact leadStatus if status was modified
    if (dto.status && lead.contactId) {
      await this.contactModel.findByIdAndUpdate(lead.contactId, { leadStatus: dto.status });
    }

    this.socketGateway.emitToWorkspace(workspaceId, 'lead.updated', {
      leadId: lead._id.toString(),
      contactId: lead.contactId.toString(),
      contactPhone: lead.contactPhone,
      status: lead.status,
      category: lead.category,
      name: lead.name,
      email: lead.email,
      budget: lead.budget,
      productInterest: lead.productInterest,
    });

    this.dispatcher
      .dispatchEvent(workspaceId, 'lead.status_changed', {
        lead: {
          id: lead._id.toString(),
          contactPhone: lead.contactPhone,
          status: lead.status,
          category: lead.category,
          name: lead.name,
          email: lead.email,
          budget: lead.budget,
          productInterest: lead.productInterest,
        },
        contact: {
          id: lead.contactId.toString(),
          phone: lead.contactPhone,
        },
      })
      .catch((err) =>
        this.logger.error(`[LeadExtraction] Outbound webhook dispatch failed: ${err.message}`),
      );

    return lead;
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ContactsService } from './contacts.service.js';
import { LeadExtractionService } from './lead-extraction.service.js';
import { ChatHistoryImportService } from './chat-history-import.service.js';
import { CreateContactDto } from './dto/index.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';
import type { LeadStatus } from '../database/schemas/extracted-lead.schema.js';

@Controller('api/contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly leadExtractionService: LeadExtractionService,
    private readonly chatHistoryImportService: ChatHistoryImportService,
  ) {}

  @Get()
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getContacts(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const contacts = await this.contactsService.getContacts(workspaceId, search, tag);
    return {
      message: 'Contacts retrieved successfully',
      data: contacts,
    };
  }

  @Get('leads')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getLeads(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const leads = await this.leadExtractionService.getLeads(workspaceId, { status, category, search });
    return {
      message: 'Leads retrieved successfully',
      data: leads,
    };
  }

  @Get('leads/by-phone/:phone')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getLeadByPhone(
    @Req() req: AuthenticatedRequest,
    @Param('phone') phone: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const lead = await this.leadExtractionService.getLeadByPhone(workspaceId, phone);
    return {
      message: 'Lead retrieved successfully',
      data: lead,
    };
  }

  @Patch('leads/:id')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async updateLead(
    @Req() req: AuthenticatedRequest,
    @Param('id') leadId: string,
    @Body()
    body: {
      status?: LeadStatus;
      category?: string;
      budget?: string;
      productInterest?: string;
      rawNotes?: string;
    },
  ) {
    const workspaceId = req.workspaceId as string;
    const lead = await this.leadExtractionService.updateLead(workspaceId, leadId, body);
    return {
      message: 'Lead updated successfully',
      data: lead,
    };
  }

  @Post()
  @UseGuards(AuthGuard, WorkspaceGuard)
  async createContact(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateContactDto,
  ) {
    const workspaceId = req.workspaceId as string;
    const contact = await this.contactsService.createContact(workspaceId, dto);
    return {
      message: 'Contact created successfully',
      data: contact,
    };
  }

  @Post('import-csv')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async importCsv(
    @Req() req: AuthenticatedRequest,
    @Body('csvContent') csvContent: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.contactsService.bulkImportCsv(workspaceId, csvContent);
    return {
      message: 'Bulk contacts imported successfully',
      data: result,
    };
  }

  @Post('import-chat-history')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async importChatHistory(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      fileContent: string;
      fallbackPhone?: string;
      businessIdentifier?: string;
    },
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.chatHistoryImportService.importWhatsAppChat(
      workspaceId,
      body.fileContent,
      body.fallbackPhone,
      body.businessIdentifier,
    );
    return {
      message: 'WhatsApp chat history imported successfully',
      data: result,
    };
  }

  @Get('export')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async exportCsv(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const workspaceId = req.workspaceId as string;
    const csvData = await this.contactsService.exportContactsCsv(workspaceId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts_export.csv');
    return res.send(csvData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async deleteContact(
    @Req() req: AuthenticatedRequest,
    @Param('id') contactId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const result = await this.contactsService.deleteContact(workspaceId, contactId);
    return {
      message: 'Contact deleted successfully',
      data: result,
    };
  }
}


import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ContactsService, CreateContactDto } from './contacts.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

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

import { Controller, Get, Post, Delete, Param, UseGuards, Req, Res, HttpStatus, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { ComplianceService } from './compliance.service.js';
import { AuthGuard, WorkspaceGuard } from '../common/guards/index.js';
import type { AuthenticatedRequest } from '../common/guards/index.js';

@Controller('api/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('contacts')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async getContacts(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const contacts = await this.complianceService.getContacts(workspaceId);
    
    return {
      message: 'Contacts retrieved successfully',
      data: contacts,
    };
  }

  @Delete('contacts/:contactId')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async deleteContact(
    @Req() req: AuthenticatedRequest,
    @Param('contactId') contactId: string,
  ) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;

    const result = await this.complianceService.processContactDeletion(
      workspaceId,
      contactId,
      userId,
    );

    return {
      message: 'Contact and all associated communication history successfully erased in compliance with DPDP regulations',
      data: result,
    };
  }

  @Post('export')
  @UseGuards(AuthGuard, WorkspaceGuard)
  async exportData(@Req() req: AuthenticatedRequest) {
    const workspaceId = req.workspaceId as string;
    const userId = req.user?.userId;

    const result = await this.complianceService.generateExport(workspaceId, userId);

    return {
      message: 'Compliance data export archive compiled successfully. Link expires in 24 hours.',
      data: result,
    };
  }

  @Get('download/:fileName')
  async downloadFile(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    console.log(`[ComplianceController] Local file download requested: ${fileName}`);
    
    const filePath = path.join(process.cwd(), 'temp', 'exports', fileName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Requested export file does not exist or has expired');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    return res.sendFile(filePath);
  }
}

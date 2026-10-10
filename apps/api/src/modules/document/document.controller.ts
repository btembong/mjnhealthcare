import { StaffOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceService } from '../compliance/compliance.service';
import { DocumentService } from './document.service';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly complianceService: ComplianceService,
    private readonly access: AccessService,
  ) {}

  @ApiOperation({ summary: 'List documents — omit status for all, or pass PENDING/VERIFIED/REJECTED' })
  @StaffOnly()
  @Get()
  async getByStatus(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    const docs = await this.documentService.getByStatus(status);
    const scope = await this.access.consultantScope(user);
    return scope ? docs.filter((d: any) => scope.canSeePerson(d.personId)) : docs;
  }

  @ApiOperation({ summary: 'Reject a document (shorthand)' })
  @StaffOnly()
  @Patch(':id/reject')
  async reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { verifiedBy: string; rejectionReason?: string }, @Request() req: any) {
    await this.access.assertDocument(user, id);
    await this.complianceService.logAuditEvent({
      actorId: req.user.id,
      action: 'document_rejected',
      resourceType: 'document',
      resourceId: id,
      metadata: { verifiedBy: body.verifiedBy, rejectionReason: body.rejectionReason },
    });
    return this.documentService.verify(id, body.verifiedBy, 'REJECTED', body.rejectionReason);
  }

  @ApiOperation({ summary: 'Get presigned R2 view URL for a document' })
  @Get(':id/view-url')
  async getViewUrl(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertDocument(user, id);
    return this.documentService.getViewUrl(id);
  }

  @ApiOperation({ summary: 'Get presigned R2 upload URL' })
  @Post('upload-url')
  async getUploadUrl(@CurrentUser() user: AuthUser, @Body() body: { personId: string; documentType: string; fileName: string }) {
    await this.access.assertPerson(user, body.personId);
    return this.documentService.getUploadUrl(body.personId, body.documentType, body.fileName);
  }

  @ApiOperation({ summary: 'Confirm upload and create Document record' })
  @Post('confirm')
  async confirmUpload(@CurrentUser() user: AuthUser, 
    @Body() body: { personId: string; documentType: string; key: string; expiryDate?: string },
  ) {
    await this.access.assertPerson(user, body.personId);
    return this.documentService.confirmUpload(
      body.personId,
      body.documentType,
      body.key,
      body.expiryDate ? new Date(body.expiryDate) : undefined,
    );
  }

  @ApiOperation({ summary: 'Officer: send blank form to client' })
  @StaffOnly()
  @Post('officer-send')
  async officerSend(@CurrentUser() user: AuthUser, 
    @Body() body: { engagementId: string; officerNote?: string; key: string; documentType: string },
    @Request() req: any,
  ) {
    await this.access.assertEngagement(user, body.engagementId);
    return this.documentService.officerSendDocument(
      body.engagementId,
      req.user.id,
      { type: body.documentType, key: body.key, officerNote: body.officerNote },
    );
  }

  @ApiOperation({ summary: 'Client: return filled form' })
  @Post('client-return')
  clientReturn(
    @Body() body: { linkedDocumentId: string; key: string; documentType: string },
    @Request() req: any,
  ) {
    return this.documentService.clientReturnDocument(
      req.user.id,
      body.linkedDocumentId,
      { key: body.key, type: body.documentType },
    );
  }

  @ApiOperation({ summary: 'Get officer-sent documents for an engagement' })
  @Get('officer-sent/:engagementId')
  async getOfficerSent(@CurrentUser() user: AuthUser, @Param('engagementId') engagementId: string) {
    await this.access.assertEngagement(user, engagementId);
    return this.documentService.getOfficerSentDocuments(engagementId);
  }

  @ApiOperation({ summary: 'Get pending-client documents for portal user' })
  @Get('pending-for-me')
  getPendingForMe(@Request() req: any) {
    return this.documentService.getPendingClientDocuments(req.user.id);
  }

  @ApiOperation({ summary: "List a person's documents" })
  @Get('person/:personId')
  async getByPerson(@CurrentUser() user: AuthUser, @Param('personId') personId: string, @Request() req: any) {
    await this.access.assertPerson(user, personId);
    await this.complianceService.logAuditEvent({
      actorId: req.user.id,
      action: 'list_documents',
      resourceType: 'person',
      resourceId: personId,
    });
    return this.documentService.getByPerson(personId);
  }

  @ApiOperation({ summary: 'Verify or reject a document (compliance team)' })
  @StaffOnly()
  @Patch(':id/verify')
  async verify(@CurrentUser() user: AuthUser, 
    @Param('id') id: string,
    @Body() body: { verifiedBy: string; status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string },
    @Request() req: any,
  ) {
    await this.access.assertDocument(user, id);
    await this.complianceService.logAuditEvent({
      actorId: req.user.id,
      action: `document_${body.status.toLowerCase()}`,
      resourceType: 'document',
      resourceId: id,
      metadata: { verifiedBy: body.verifiedBy },
    });
    return this.documentService.verify(id, body.verifiedBy, body.status, body.rejectionReason);
  }
}

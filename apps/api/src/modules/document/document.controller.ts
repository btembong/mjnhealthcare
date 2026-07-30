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
  ) {}

  @ApiOperation({ summary: 'List documents by status (admin)' })
  @Get()
  getByStatus(@Query('status') status: string = 'PENDING') {
    return this.documentService.getByStatus(status);
  }

  @ApiOperation({ summary: 'Reject a document (shorthand)' })
  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { verifiedBy: string; rejectionReason?: string }, @Request() req: any) {
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
  getViewUrl(@Param('id') id: string) {
    return this.documentService.getViewUrl(id);
  }

  @ApiOperation({ summary: 'Get presigned R2 upload URL' })
  @Post('upload-url')
  getUploadUrl(@Body() body: { personId: string; documentType: string; fileName: string }) {
    return this.documentService.getUploadUrl(body.personId, body.documentType, body.fileName);
  }

  @ApiOperation({ summary: 'Confirm upload and create Document record' })
  @Post('confirm')
  confirmUpload(
    @Body() body: { personId: string; documentType: string; key: string; expiryDate?: string },
  ) {
    return this.documentService.confirmUpload(
      body.personId,
      body.documentType,
      body.key,
      body.expiryDate ? new Date(body.expiryDate) : undefined,
    );
  }

  @ApiOperation({ summary: "List a person's documents" })
  @Get('person/:personId')
  async getByPerson(@Param('personId') personId: string, @Request() req: any) {
    await this.complianceService.logAuditEvent({
      actorId: req.user.id,
      action: 'list_documents',
      resourceType: 'person',
      resourceId: personId,
    });
    return this.documentService.getByPerson(personId);
  }

  @ApiOperation({ summary: 'Verify or reject a document (compliance team)' })
  @Patch(':id/verify')
  async verify(
    @Param('id') id: string,
    @Body() body: { verifiedBy: string; status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string },
    @Request() req: any,
  ) {
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

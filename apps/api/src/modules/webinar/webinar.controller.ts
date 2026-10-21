import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser, AuthUser, RolesOnly } from '../auth/access';
import { RegistrationInput, WebinarInput, WebinarService } from './webinar.service';
import { WebinarLiveService } from './webinar-live.service';

/** Admins and consultants run webinars. Consultants change only the ones they host or created. */
@Controller('webinars/admin')
@RolesOnly('ADMIN', 'CONSULTANT')
export class WebinarAdminController {
  constructor(private readonly webinars: WebinarService, private readonly live: WebinarLiveService) {}

  @Get()
  list() {
    return this.webinars.list();
  }

  @Get('hosts')
  hosts() {
    return this.webinars.hostChoices();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.webinars.detail(id);
  }

  @Get(':id/export')
  async export(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.webinars.exportCsv(id);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="webinar-registrations-${id.slice(-6)}.csv"`);
    res.send(`﻿${csv}`);
  }

  @Post()
  @HttpCode(200)
  create(@CurrentUser() user: AuthUser, @Body() body: WebinarInput) {
    return this.webinars.create(user, body ?? {});
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: WebinarInput) {
    return this.webinars.update(user, id, body ?? {});
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.webinars.publish(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.webinars.cancel(user, id, String(body?.reason ?? ''));
  }

  @Post(':id/host-pass')
  @HttpCode(200)
  hostPass(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.webinars.hostPass(user, id);
  }

  @Post(':id/start')
  @HttpCode(200)
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.webinars.start(user, id);
  }

  @Post(':id/end')
  @HttpCode(200)
  end(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.webinars.end(user, id);
  }

  // ── During the webinar ──

  @Get(':id/live')
  liveView(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.live.hostView(user, id);
  }

  @Post(':id/questions/:questionId/:action')
  @HttpCode(200)
  moderate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('questionId') questionId: string, @Param('action') action: string) {
    return this.live.moderate(user, id, questionId, action);
  }

  @Post(':id/polls')
  @HttpCode(200)
  createPoll(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { question?: string; options?: string[] }) {
    return this.live.createPoll(user, id, body ?? {});
  }

  @Post(':id/polls/:pollId/:action')
  @HttpCode(200)
  pollAction(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('pollId') pollId: string, @Param('action') action: string) {
    return this.live.pollAction(user, id, pollId, action);
  }

  @Post(':id/offer')
  @HttpCode(200)
  offer(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { label?: string; url?: string; visible?: boolean }) {
    return this.live.setOffer(user, id, body ?? {});
  }

  @Post(':id/check-recording')
  @HttpCode(200)
  checkRecording(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.webinars.checkRecordingNow(user, id);
  }
}

/** The website: listing, registration, the personal join page, and replays. No login. */
@Controller('webinars')
export class WebinarPublicController {
  constructor(private readonly webinars: WebinarService, private readonly live: WebinarLiveService) {}

  @Get('public')
  list(@Query('language') language?: string) {
    return this.webinars.listPublic(language);
  }

  @Get('public/:slug')
  get(@Param('slug') slug: string) {
    return this.webinars.getPublic(slug);
  }

  @Post('public/:slug/register')
  @HttpCode(200)
  register(@Param('slug') slug: string, @Body() body: RegistrationInput) {
    return this.webinars.register(slug, body ?? {});
  }

  @Get('public/:slug/replay')
  replay(@Param('slug') slug: string) {
    return this.webinars.replay(slug);
  }

  @Get('attend/:token')
  attend(@Param('token') token: string) {
    return this.webinars.attend(token);
  }

  @Post('attend/:token/heartbeat')
  @HttpCode(200)
  heartbeat(@Param('token') token: string) {
    return this.webinars.heartbeat(token);
  }

  @Post('attend/:token/cancel')
  @HttpCode(200)
  cancelSeat(@Param('token') token: string) {
    return this.webinars.cancelSeat(token);
  }

  @Get('attend/:token/live')
  liveView(@Param('token') token: string) {
    return this.live.view(token);
  }

  @Post('attend/:token/questions')
  @HttpCode(200)
  ask(@Param('token') token: string, @Body() body: { text?: string }) {
    return this.live.ask(token, String(body?.text ?? ''));
  }

  @Post('attend/:token/questions/:questionId/vote')
  @HttpCode(200)
  vote(@Param('token') token: string, @Param('questionId') questionId: string) {
    return this.live.vote(token, questionId);
  }

  @Post('attend/:token/polls/:pollId')
  @HttpCode(200)
  answerPoll(@Param('token') token: string, @Param('pollId') pollId: string, @Body() body: { option?: number }) {
    return this.live.answerPoll(token, pollId, Number(body?.option));
  }

  @Post('attend/:token/offer-click')
  @HttpCode(200)
  offerClicked(@Param('token') token: string) {
    return this.live.offerClicked(token);
  }

  @Get('attend/:token/survey')
  survey(@Param('token') token: string) {
    return this.live.survey(token);
  }

  @Post('attend/:token/survey')
  @HttpCode(200)
  submitSurvey(@Param('token') token: string, @Body() body: { rating?: number; wantsContact?: boolean; comment?: string }) {
    return this.live.submitSurvey(token, body ?? {});
  }

  @Get('attend/:token/calendar.ics')
  async calendar(@Param('token') token: string, @Res() res: Response) {
    const ics = await this.webinars.calendar(token);
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="webinar.ics"');
    res.send(ics);
  }
}

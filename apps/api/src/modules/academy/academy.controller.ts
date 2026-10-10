import { StaffOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademyService } from './academy.service';

@ApiTags('academy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academy')
export class AcademyController {
  constructor(
    private readonly academyService: AcademyService,
    private readonly access: AccessService,
  ) {}

  // ── Courses ────────────────────────────────────────────────────────────────

  @Get('courses')
  getCourses(@Query('locale') locale: 'en' | 'fr' = 'en') {
    return this.academyService.getCourses(locale);
  }

  @StaffOnly()
  @Get('courses/admin')
  getCoursesAdmin() {
    return this.academyService.getCoursesAdmin();
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.academyService.getCourse(id);
  }

  @StaffOnly()
  @Post('courses')
  createCourse(
    @Body() body: {
      title: string;
      description?: string;
      locale: 'en' | 'fr';
      examType: string;
      durationHours?: number;
      isPublished?: boolean;
    },
  ) {
    return this.academyService.createCourse(body);
  }

  @StaffOnly()
  @Patch('courses/:id')
  updateCourse(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; durationHours?: number; isPublished?: boolean },
  ) {
    return this.academyService.updateCourse(id, body);
  }

  // ── Enrollments ────────────────────────────────────────────────────────────

  @Post('enroll')
  async enrollPerson(@CurrentUser() user: AuthUser, @Body() body: { personId: string; courseId: string }) {
    await this.access.assertPerson(user, body.personId);
    return this.academyService.enrollPerson(body.personId, body.courseId);
  }

  @Get('enrollments/:personId')
  async getEnrollments(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.academyService.getEnrollmentsForPerson(personId);
  }

  @Patch('enrollments/:personId/:courseId/progress')
  async updateProgress(@CurrentUser() user: AuthUser, 
    @Param('personId') personId: string,
    @Param('courseId') courseId: string,
    @Body() body: { progressPct: number },
  ) {
    await this.access.assertPerson(user, personId);
    return this.academyService.updateProgress(personId, courseId, body.progressPct);
  }

  // ── Question Banks ─────────────────────────────────────────────────────────

  @Get('question-banks')
  getQuestionBanks(@Query('examType') examType?: string) {
    return this.academyService.getQuestionBanks(examType);
  }

  @StaffOnly()
  @Post('question-banks')
  createQuestionBank(@Body() body: { courseId?: string; title: string; examType: string; locale: 'en' | 'fr' }) {
    return this.academyService.createQuestionBank(body);
  }

  @Get('question-banks/:id/questions')
  getQuestions(@Param('id') id: string) {
    return this.academyService.getQuestions(id);
  }

  @StaffOnly()
  @Post('question-banks/:id/questions')
  createQuestion(
    @Param('id') id: string,
    @Body() body: { stem: string; options: string[]; correctIndex: number; explanation?: string; topic?: string },
  ) {
    return this.academyService.createQuestion(id, body);
  }

  // ── Study Plans ────────────────────────────────────────────────────────────

  @Get('study-plan/:personId')
  async getStudyPlan(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.academyService.getStudyPlan(personId);
  }

  @StaffOnly()
  @Post('study-plan/:personId')
  createStudyPlan(
    @Param('personId') personId: string,
    @Body() body: { items: { topic: string; dueDate?: string }[] },
  ) {
    return this.academyService.createStudyPlan(personId, body.items);
  }

  @Patch('study-plan/items/:itemId/complete')
  async markItemComplete(@CurrentUser() user: AuthUser, @Param('itemId') itemId: string) {
    await this.access.assertStudyItem(user, itemId);
    return this.academyService.markStudyItemComplete(itemId);
  }

  // ── Practice Results ───────────────────────────────────────────────────────

  @Post('practice/:personId/result')
  async recordResult(@CurrentUser() user: AuthUser, 
    @Param('personId') personId: string,
    @Body() body: { questionBankId: string; score: number; total: number; topic?: string },
  ) {
    await this.access.assertPerson(user, personId);
    return this.academyService.recordPracticeResult(personId, body.questionBankId, body.score, body.total, body.topic);
  }

  @Get('practice/:personId/history')
  async getPracticeHistory(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.academyService.getPracticeHistory(personId);
  }

  @Get('practice/:personId/weak-areas')
  async getWeakAreas(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.academyService.getWeakAreas(personId);
  }

  // ── Modules ────────────────────────────────────────────────────────────────

  @StaffOnly()
  @Post('courses/:id/modules')
  createModule(
    @Param('id') courseId: string,
    @Body() body: { title: string; sortOrder?: number },
  ) {
    return this.academyService.createModule(courseId, body.title, body.sortOrder);
  }

  @StaffOnly()
  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() body: { title?: string; sortOrder?: number }) {
    return this.academyService.updateModule(id, body);
  }

  @StaffOnly()
  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.academyService.deleteModule(id);
  }

  // ── Lessons ────────────────────────────────────────────────────────────────

  @StaffOnly()
  @Post('modules/:id/lessons')
  createLesson(
    @Param('id') moduleId: string,
    @Body() body: { title: string; type: 'VIDEO' | 'PDF' | 'TEXT'; contentUrl?: string; body?: string; sortOrder?: number },
  ) {
    return this.academyService.createLesson(moduleId, body);
  }

  @StaffOnly()
  @Patch('lessons/:id')
  updateLesson(
    @Param('id') id: string,
    @Body() body: { title?: string; type?: string; contentUrl?: string; body?: string; sortOrder?: number },
  ) {
    return this.academyService.updateLesson(id, body);
  }

  @StaffOnly()
  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.academyService.deleteLesson(id);
  }

  // ── Live Sessions ──────────────────────────────────────────────────────────

  @StaffOnly()
  @Post('courses/:id/sessions')
  scheduleSession(
    @Param('id') courseId: string,
    @Body() body: { title: string; scheduledAt: string; durationMins?: number },
  ) {
    return this.academyService.scheduleLiveSession(courseId, body);
  }

  @Get('courses/:id/sessions')
  getCourseSessions(@Param('id') courseId: string) {
    return this.academyService.getCourseLiveSessions(courseId);
  }

  @StaffOnly()
  @Post('sessions/:id/start')
  startSession(@Param('id') id: string) {
    return this.academyService.startLiveSession(id);
  }

  @StaffOnly()
  @Post('sessions/:id/end')
  endSession(@Param('id') id: string) {
    return this.academyService.endLiveSession(id);
  }

  @StaffOnly()
  @Delete('sessions/:id')
  cancelSession(@Param('id') id: string) {
    return this.academyService.cancelLiveSession(id);
  }

  @Get('sessions/upcoming')
  getUpcomingSessions(@Query('courseIds') courseIds: string) {
    const ids = courseIds ? courseIds.split(',') : [];
    return this.academyService.getUpcomingLiveSessions(ids);
  }

  // Legacy
  @StaffOnly()
  @Post('sessions/:id/room')
  createRoom(@Param('id') id: string) {
    return this.academyService.createDailyRoom(id);
  }
}

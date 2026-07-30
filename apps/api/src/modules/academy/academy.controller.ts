import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademyService } from './academy.service';

@ApiTags('academy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  // ── Courses ────────────────────────────────────────────────────────────────

  @Get('courses')
  getCourses(@Query('locale') locale: 'en' | 'fr' = 'en') {
    return this.academyService.getCourses(locale);
  }

  @Get('courses/admin')
  getCoursesAdmin() {
    return this.academyService.getCoursesAdmin();
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.academyService.getCourse(id);
  }

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

  @Patch('courses/:id')
  updateCourse(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; durationHours?: number; isPublished?: boolean },
  ) {
    return this.academyService.updateCourse(id, body);
  }

  // ── Enrollments ────────────────────────────────────────────────────────────

  @Post('enroll')
  enrollPerson(@Body() body: { personId: string; courseId: string }) {
    return this.academyService.enrollPerson(body.personId, body.courseId);
  }

  @Get('enrollments/:personId')
  getEnrollments(@Param('personId') personId: string) {
    return this.academyService.getEnrollmentsForPerson(personId);
  }

  @Patch('enrollments/:personId/:courseId/progress')
  updateProgress(
    @Param('personId') personId: string,
    @Param('courseId') courseId: string,
    @Body() body: { progressPct: number },
  ) {
    return this.academyService.updateProgress(personId, courseId, body.progressPct);
  }

  // ── Question Banks ─────────────────────────────────────────────────────────

  @Get('question-banks')
  getQuestionBanks(@Query('examType') examType?: string) {
    return this.academyService.getQuestionBanks(examType);
  }

  @Post('question-banks')
  createQuestionBank(@Body() body: { courseId?: string; title: string; examType: string; locale: 'en' | 'fr' }) {
    return this.academyService.createQuestionBank(body);
  }

  @Get('question-banks/:id/questions')
  getQuestions(@Param('id') id: string) {
    return this.academyService.getQuestions(id);
  }

  @Post('question-banks/:id/questions')
  createQuestion(
    @Param('id') id: string,
    @Body() body: { stem: string; options: string[]; correctIndex: number; explanation?: string; topic?: string },
  ) {
    return this.academyService.createQuestion(id, body);
  }

  // ── Study Plans ────────────────────────────────────────────────────────────

  @Get('study-plan/:personId')
  getStudyPlan(@Param('personId') personId: string) {
    return this.academyService.getStudyPlan(personId);
  }

  @Post('study-plan/:personId')
  createStudyPlan(
    @Param('personId') personId: string,
    @Body() body: { items: { topic: string; dueDate?: string }[] },
  ) {
    return this.academyService.createStudyPlan(personId, body.items);
  }

  @Patch('study-plan/items/:itemId/complete')
  markItemComplete(@Param('itemId') itemId: string) {
    return this.academyService.markStudyItemComplete(itemId);
  }

  // ── Practice Results ───────────────────────────────────────────────────────

  @Post('practice/:personId/result')
  recordResult(
    @Param('personId') personId: string,
    @Body() body: { questionBankId: string; score: number; total: number; topic?: string },
  ) {
    return this.academyService.recordPracticeResult(personId, body.questionBankId, body.score, body.total, body.topic);
  }

  @Get('practice/:personId/history')
  getPracticeHistory(@Param('personId') personId: string) {
    return this.academyService.getPracticeHistory(personId);
  }

  @Get('practice/:personId/weak-areas')
  getWeakAreas(@Param('personId') personId: string) {
    return this.academyService.getWeakAreas(personId);
  }

  // ── Modules ────────────────────────────────────────────────────────────────

  @Post('courses/:id/modules')
  createModule(
    @Param('id') courseId: string,
    @Body() body: { title: string; sortOrder?: number },
  ) {
    return this.academyService.createModule(courseId, body.title, body.sortOrder);
  }

  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() body: { title?: string; sortOrder?: number }) {
    return this.academyService.updateModule(id, body);
  }

  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.academyService.deleteModule(id);
  }

  // ── Lessons ────────────────────────────────────────────────────────────────

  @Post('modules/:id/lessons')
  createLesson(
    @Param('id') moduleId: string,
    @Body() body: { title: string; type: 'VIDEO' | 'PDF' | 'TEXT'; contentUrl?: string; body?: string; sortOrder?: number },
  ) {
    return this.academyService.createLesson(moduleId, body);
  }

  @Patch('lessons/:id')
  updateLesson(
    @Param('id') id: string,
    @Body() body: { title?: string; type?: string; contentUrl?: string; body?: string; sortOrder?: number },
  ) {
    return this.academyService.updateLesson(id, body);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.academyService.deleteLesson(id);
  }

  // ── Live Sessions ──────────────────────────────────────────────────────────

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

  @Post('sessions/:id/start')
  startSession(@Param('id') id: string) {
    return this.academyService.startLiveSession(id);
  }

  @Post('sessions/:id/end')
  endSession(@Param('id') id: string) {
    return this.academyService.endLiveSession(id);
  }

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
  @Post('sessions/:id/room')
  createRoom(@Param('id') id: string) {
    return this.academyService.createDailyRoom(id);
  }
}

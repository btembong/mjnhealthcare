import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class AcademyService {
  constructor(private readonly db: DatabaseService) {}

  // ── Courses ────────────────────────────────────────────────────────────────

  async getCourses(locale: 'en' | 'fr') {
    return this.db.course.findMany({
      where: { locale, isPublished: true },
      include: { questionBanks: { select: { id: true, title: true, examType: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCoursesAdmin() {
    return this.db.course.findMany({
      include: {
        questionBanks: { select: { id: true, title: true, _count: { select: { questions: true } } } },
        enrollments: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCourse(data: {
    title: string;
    description?: string;
    locale: 'en' | 'fr';
    examType: string;
    durationHours?: number;
    isPublished?: boolean;
  }) {
    return this.db.course.create({ data });
  }

  async getCourse(id: string) {
    return this.db.course.findUniqueOrThrow({
      where: { id },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        },
        liveSessions: { orderBy: { scheduledAt: 'asc' } },
        questionBanks: {
          include: { _count: { select: { questions: true } } },
          orderBy: { createdAt: 'asc' },
        },
        enrollments: {
          include: { person: { select: { id: true, name: true, email: true, profession: true } } },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    });
  }

  async updateCourse(id: string, data: {
    title?: string;
    description?: string;
    durationHours?: number;
    isPublished?: boolean;
    examType?: string;
    locale?: string;
  }) {
    return this.db.course.update({ where: { id }, data: data as any });
  }

  // ── Modules ────────────────────────────────────────────────────────────────

  async createModule(courseId: string, title: string, sortOrder?: number) {
    const count = await this.db.module.count({ where: { courseId } });
    return this.db.module.create({ data: { courseId, title, sortOrder: sortOrder ?? count } });
  }

  async updateModule(id: string, data: { title?: string; sortOrder?: number }) {
    return this.db.module.update({ where: { id }, data });
  }

  async deleteModule(id: string) {
    return this.db.module.delete({ where: { id } });
  }

  // ── Lessons ────────────────────────────────────────────────────────────────

  async createLesson(moduleId: string, data: {
    title: string;
    type: 'VIDEO' | 'PDF' | 'TEXT';
    contentUrl?: string;
    body?: string;
    sortOrder?: number;
  }) {
    const count = await this.db.lesson.count({ where: { moduleId } });
    return this.db.lesson.create({
      data: { moduleId, title: data.title, type: data.type, contentUrl: data.contentUrl, body: data.body, sortOrder: data.sortOrder ?? count },
    });
  }

  async updateLesson(id: string, data: { title?: string; type?: string; contentUrl?: string; body?: string; sortOrder?: number }) {
    return this.db.lesson.update({ where: { id }, data: data as any });
  }

  async deleteLesson(id: string) {
    return this.db.lesson.delete({ where: { id } });
  }

  // ── Enrollments ────────────────────────────────────────────────────────────

  async enrollPerson(personId: string, courseId: string) {
    const existing = await this.db.courseEnrollment.findUnique({
      where: { courseId_personId: { courseId, personId } },
    });
    if (existing) return existing;
    return this.db.courseEnrollment.create({ data: { personId, courseId } });
  }

  async getEnrollmentsForPerson(personId: string) {
    return this.db.courseEnrollment.findMany({
      where: { personId },
      include: { course: true },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async updateProgress(personId: string, courseId: string, progressPct: number) {
    return this.db.courseEnrollment.update({
      where: { courseId_personId: { courseId, personId } },
      data: {
        progressPct,
        ...(progressPct >= 100 ? { completedAt: new Date() } : {}),
      },
    });
  }

  // ── Question Banks ─────────────────────────────────────────────────────────

  async getQuestionBanks(examType?: string) {
    return this.db.questionBank.findMany({
      where: examType ? { examType } : undefined,
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuestionBank(data: { courseId?: string; title: string; examType: string; locale: 'en' | 'fr' }) {
    return this.db.questionBank.create({ data });
  }

  async getQuestions(bankId: string) {
    return this.db.question.findMany({
      where: { questionBankId: bankId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createQuestion(bankId: string, data: {
    stem: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    topic?: string;
  }) {
    return this.db.question.create({
      data: {
        questionBankId: bankId,
        stem: data.stem,
        options: data.options,
        correctIndex: data.correctIndex,
        explanation: data.explanation,
        topic: data.topic,
      },
    });
  }

  // ── Study Plans ────────────────────────────────────────────────────────────

  async getStudyPlan(personId: string) {
    return this.db.studyPlan.findFirst({ where: { personId }, include: { items: true } });
  }

  async createStudyPlan(personId: string, items: { topic: string; dueDate?: string }[]) {
    return this.db.studyPlan.create({
      data: {
        personId,
        items: {
          create: items.map((i) => ({
            topic: i.topic,
            dueDate: i.dueDate ? new Date(i.dueDate) : null,
          })),
        },
      },
      include: { items: true },
    });
  }

  async markStudyItemComplete(itemId: string) {
    return this.db.studyPlanItem.update({ where: { id: itemId }, data: { completed: true } });
  }

  // ── Practice Results & Weak Areas ─────────────────────────────────────────

  async recordPracticeResult(personId: string, questionBankId: string, score: number, total: number, topic?: string) {
    return this.db.practiceResult.create({
      data: { personId, questionBankId, score, total, percentage: (score / total) * 100, topic },
    });
  }

  async getPracticeHistory(personId: string) {
    return this.db.practiceResult.findMany({
      where: { personId },
      include: { questionBank: { select: { title: true, examType: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getWeakAreas(personId: string): Promise<{ topic: string; avgPercentage: number; attempts: number }[]> {
    const results = await this.db.practiceResult.findMany({
      where: { personId, topic: { not: null } },
      select: { topic: true, percentage: true },
    });

    const byTopic = new Map<string, { sum: number; count: number }>();
    for (const r of results) {
      if (!r.topic) continue;
      const entry = byTopic.get(r.topic) ?? { sum: 0, count: 0 };
      entry.sum += r.percentage;
      entry.count += 1;
      byTopic.set(r.topic, entry);
    }

    return Array.from(byTopic.entries())
      .map(([topic, { sum, count }]) => ({ topic, avgPercentage: sum / count, attempts: count }))
      .filter((t) => t.avgPercentage < 70) // below 70% = weak area
      .sort((a, b) => a.avgPercentage - b.avgPercentage);
  }

  // ── Live Sessions ─────────────────────────────────────────────────────────

  async scheduleLiveSession(courseId: string, data: { title: string; scheduledAt: string; durationMins?: number }) {
    return this.db.liveSession.create({
      data: {
        courseId,
        title: data.title,
        scheduledAt: new Date(data.scheduledAt),
        durationMins: data.durationMins ?? 60,
        status: 'SCHEDULED',
      },
    });
  }

  async getCourseLiveSessions(courseId: string) {
    return this.db.liveSession.findMany({
      where: { courseId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getUpcomingLiveSessions(courseIds: string[]) {
    return this.db.liveSession.findMany({
      where: { courseId: { in: courseIds }, scheduledAt: { gte: new Date() }, status: { in: ['SCHEDULED', 'LIVE'] } },
      include: { course: { select: { id: true, title: true, examType: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async startLiveSession(sessionId: string): Promise<{ meetingUrl: string; hostToken: string }> {
    const roomName = `mjn-live-${sessionId}`;
    const apiKey = process.env.DAILY_CO_API_KEY ?? process.env.DAILY_API_KEY ?? '';

    // Create Daily.co room with expiry 2h after now
    const exp = Math.floor(Date.now() / 1000) + 7200;
    const roomRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName, properties: { exp, enable_recording: 'cloud', enable_chat: true } }),
    });
    const room: any = await roomRes.json();

    // Create host token
    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { room_name: roomName, is_owner: true, exp } }),
    });
    const token: any = await tokenRes.json();

    const meetingUrl: string = room.url ?? `https://mjnhealth.daily.co/${roomName}`;
    const hostToken: string = token.token ?? '';

    await this.db.liveSession.update({
      where: { id: sessionId },
      data: { status: 'LIVE', meetingUrl, dailyRoomName: roomName, hostToken },
    });

    return { meetingUrl, hostToken };
  }

  async endLiveSession(sessionId: string) {
    return this.db.liveSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });
  }

  async cancelLiveSession(sessionId: string) {
    return this.db.liveSession.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' },
    });
  }

  // ── Legacy Daily.co (kept for backward compat) ────────────────────────────

  async createDailyRoom(sessionId: string): Promise<{ url: string }> {
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY ?? process.env.DAILY_CO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: `mjn-session-${sessionId}`, properties: { enable_recording: 'cloud' } }),
    });
    const data: any = await res.json();
    return { url: data.url as string };
  }
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ArrowLeft, Play, FilePdf, Article, Video, CheckCircle,
  CircleNotch, CaretDown, CaretRight, Lock, Brain,
  WarningCircle, BookOpen,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';
import { useUser } from '../../../../contexts/user-context';
import { toast } from 'sonner';

const TYPE_ICON: Record<string, any> = { VIDEO: Video, PDF: FilePdf, TEXT: Article };
const TYPE_COLOR: Record<string, string> = {
  VIDEO: 'bg-violet-100 text-violet-700',
  PDF: 'bg-rose-100 text-rose-700',
  TEXT: 'bg-blue-100 text-blue-700',
};

// ── Lesson Viewer ─────────────────────────────────────────────────────────────

function LessonViewer({ lesson }: { lesson: any }) {
  if (!lesson) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-center">
        <div>
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">Select a lesson to begin</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose from the modules on the left.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${TYPE_COLOR[lesson.type] ?? 'bg-muted text-muted-foreground'}`}>
          {lesson.type}
        </div>
        <h2 className="mt-2 text-xl font-bold text-foreground">{lesson.title}</h2>
      </div>

      {/* VIDEO */}
      {lesson.type === 'VIDEO' && lesson.contentUrl && (
        <div className="overflow-hidden rounded-2xl bg-black shadow-lg aspect-video">
          {lesson.contentUrl.includes('youtube.com') || lesson.contentUrl.includes('youtu.be') ? (
            <iframe
              src={lesson.contentUrl.replace('watch?v=', 'embed/')}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : lesson.contentUrl.includes('vimeo.com') ? (
            <iframe
              src={lesson.contentUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video controls className="h-full w-full" src={lesson.contentUrl}>
              Your browser does not support video.
            </video>
          )}
        </div>
      )}

      {/* PDF */}
      {lesson.type === 'PDF' && lesson.contentUrl && (
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <iframe
            src={lesson.contentUrl}
            className="w-full"
            style={{ height: '70vh' }}
            title={lesson.title}
          />
          <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-center">
            <a href={lesson.contentUrl} target="_blank" rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline">
              Open PDF in new tab
            </a>
          </div>
        </div>
      )}

      {/* TEXT */}
      {lesson.type === 'TEXT' && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm prose prose-sm max-w-none">
          {lesson.body ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{lesson.body}</div>
          ) : (
            <p className="text-muted-foreground italic">No content yet for this lesson.</p>
          )}
        </div>
      )}

      {/* No content fallback */}
      {!lesson.contentUrl && !lesson.body && (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">Content for this lesson has not been uploaded yet.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CourseViewerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { me } = useUser();

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savingProgress, setSavingProgress] = useState(false);

  const load = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const [courseData, enrollments] = await Promise.all([
        api.getCourse(courseId),
        api.getEnrollments(me.id),
      ]);
      setCourse(courseData);

      const enr = (enrollments ?? []).find((e: any) => e.courseId === courseId);
      setEnrollment(enr ?? null);

      // Restore completed lessons from localStorage
      const stored = localStorage.getItem(`mjn_course_${courseId}_completed`);
      if (stored) {
        try { setCompletedIds(new Set(JSON.parse(stored))); } catch {}
      }

      // Auto-expand first module and select first lesson
      if (courseData?.modules?.length > 0) {
        const firstMod = courseData.modules[0];
        setExpanded({ [firstMod.id]: true });
        if (firstMod.lessons?.length > 0) setActiveLesson(firstMod.lessons[0]);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [courseId, me]);

  useEffect(() => { load(); }, [load]);

  const allLessons = course?.modules?.flatMap((m: any) => m.lessons ?? []) ?? [];
  const totalLessons = allLessons.length;
  const progressPct = totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  async function markComplete(lessonId: string) {
    const next = new Set(completedIds);
    next.add(lessonId);
    setCompletedIds(next);

    // Persist to localStorage
    localStorage.setItem(`mjn_course_${courseId}_completed`, JSON.stringify([...next]));

    // Update server progress if enrolled
    if (enrollment && me) {
      const pct = Math.round((next.size / totalLessons) * 100);
      setSavingProgress(true);
      try {
        await api.updateProgress(me.id, courseId, pct);
        setEnrollment((prev: any) => ({ ...prev, progressPct: pct }));
      } catch {
        // Non-blocking — progress saved locally regardless
      } finally {
        setSavingProgress(false);
      }
    }
  }

  function handleSelectLesson(lesson: any) {
    setActiveLesson(lesson);
    // Auto-mark as complete when opened (can change to explicit button if preferred)
    if (!completedIds.has(lesson.id)) {
      markComplete(lesson.id);
    }
  }

  function goToNext() {
    const idx = allLessons.findIndex((l: any) => l.id === activeLesson?.id);
    if (idx >= 0 && idx < allLessons.length - 1) {
      const next = allLessons[idx + 1];
      handleSelectLesson(next);
      // Expand the module that contains it
      const mod = course.modules.find((m: any) => m.lessons?.some((l: any) => l.id === next.id));
      if (mod) setExpanded((p) => ({ ...p, [mod.id]: true }));
    }
  }

  const currentIdx = allLessons.findIndex((l: any) => l.id === activeLesson?.id);
  const hasNext = currentIdx >= 0 && currentIdx < allLessons.length - 1;
  const isComplete = progressPct >= 100;

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-[calc(100vh-10rem)] rounded-2xl" />
          <Skeleton className="lg:col-span-2 h-[calc(100vh-10rem)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center py-24 text-center">
        <div>
          <WarningCircle className="mx-auto mb-3 h-10 w-10 text-rose-400" />
          <p className="font-semibold text-foreground">{error || 'Course not found'}</p>
          <button onClick={() => router.push('/academy')}
            className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            Back to Academy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/academy')}
          className="rounded-xl border border-border p-2 hover:bg-muted/50 transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{course.title}</h1>
          <p className="text-xs text-muted-foreground">
            {course.examType} · {course.modules?.length ?? 0} modules · {totalLessons} lessons
          </p>
        </div>
        {/* Progress pill */}
        {enrollment && (
          <div className="flex items-center gap-2 shrink-0">
            {savingProgress && <CircleNotch className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
              {isComplete ? <CheckCircle className="h-3.5 w-3.5" /> : null}
              {progressPct}% complete
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {enrollment && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: 'calc(100vh - 14rem)' }}>

        {/* ── Left: Module/Lesson sidebar ── */}
        <div className="lg:col-span-1 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 14rem)' }}>
          {(course.modules ?? []).length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No modules yet.</p>
            </div>
          ) : (
            (course.modules ?? []).map((mod: any, mIdx: number) => {
              const isOpen = expanded[mod.id] ?? (mIdx === 0);
              const modCompleted = (mod.lessons ?? []).every((l: any) => completedIds.has(l.id));
              return (
                <div key={mod.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                  {/* Module header */}
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [mod.id]: !isOpen }))}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                  >
                    {isOpen ? <CaretDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="flex-1 text-sm font-semibold text-foreground">{mod.title}</span>
                    {modCompleted && mod.lessons?.length > 0 && (
                      <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-emerald-500" />
                    )}
                  </button>

                  {/* Lessons */}
                  {isOpen && (
                    <div className="border-t border-border divide-y divide-border">
                      {(mod.lessons ?? []).length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground italic">No lessons in this module.</p>
                      ) : (
                        (mod.lessons ?? []).map((lesson: any) => {
                          const isActive = activeLesson?.id === lesson.id;
                          const isDone = completedIds.has(lesson.id);
                          const LIcon = TYPE_ICON[lesson.type] ?? Article;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-primary/8 border-l-2 border-primary' : 'hover:bg-muted/20'}`}
                            >
                              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isDone ? 'bg-emerald-100' : 'bg-muted/60'}`}>
                                {isDone
                                  ? <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-600" />
                                  : <LIcon className="h-3 w-3 text-muted-foreground" />
                                }
                              </div>
                              <span className={`flex-1 text-xs leading-snug ${isActive ? 'font-semibold text-primary' : isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {lesson.title}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Not enrolled warning */}
          {!enrollment && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <Lock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700 leading-snug">
                You can preview this course. <span className="font-semibold">Enrol</span> from the Academy page to track your progress.
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Lesson viewer ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 rounded-2xl border border-border bg-white shadow-sm p-6 overflow-y-auto" style={{ minHeight: '400px' }}>
            <LessonViewer lesson={activeLesson} />
          </div>

          {/* Navigation footer */}
          {activeLesson && (
            <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-3 shadow-sm">
              <div className="text-xs text-muted-foreground">
                Lesson {currentIdx + 1} of {totalLessons}
              </div>
              <div className="flex items-center gap-2">
                {completedIds.has(activeLesson.id) ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle weight="fill" className="h-4 w-4" /> Completed
                  </span>
                ) : (
                  <button
                    onClick={() => markComplete(activeLesson.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Mark complete
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={goToNext}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    Next lesson <CaretRight className="h-3.5 w-3.5" />
                  </button>
                )}
                {!hasNext && isComplete && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white">
                    <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Course complete!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Practice banks quick access */}
          {course.questionBanks?.length > 0 && (
            <div className="rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Practice Question Banks</p>
              <div className="flex flex-wrap gap-2">
                {course.questionBanks.map((bank: any) => (
                  <button
                    key={bank.id}
                    onClick={() => router.push(`/academy/practice/${bank.id}`)}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                    {bank.title}
                    {bank._count?.questions != null && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{bank._count.questions}Q</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

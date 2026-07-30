'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@mjn/ui';
import {
  ArrowLeft, Plus, Trash, CheckCircle, CircleNotch,
  Video, FilePdf, Article, Books, Users, Gear, BookOpen,
  CaretDown, CaretRight, Warning, CalendarBlank, Play, Stop,
  LinkSimple, Clock, X,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';

const EXAM_TYPES = ['NCLEX', 'HAAD', 'DHA', 'CBT', 'DA', 'NMC', 'CGFNS'];

const LESSON_ICONS: Record<string, any> = { VIDEO: Video, PDF: FilePdf, TEXT: Article };
const LESSON_COLORS: Record<string, string> = {
  VIDEO: 'bg-violet-100 text-violet-700',
  PDF: 'bg-rose-100 text-rose-700',
  TEXT: 'bg-blue-100 text-blue-700',
};


// ── Content Tab ──────────────────────────────────────────────────────────────

function ContentTab({ course, reload }: { course: any; reload: () => void }) {
  const [addingModule, setAddingModule] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingLesson, setAddingLesson] = useState<string | null>(null); // moduleId
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'TEXT' as 'VIDEO' | 'PDF' | 'TEXT', contentUrl: '', body: '' });

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setSaving(true);
    try {
      await api.createModule(course.id, { title: moduleTitle.trim() });
      setModuleTitle('');
      setAddingModule(false);
      reload();
    } finally { setSaving(false); }
  }

  async function handleDeleteModule(id: string) {
    if (!confirm('Delete this module and all its lessons?')) return;
    await api.deleteModule(id);
    reload();
  }

  async function handleAddLesson(e: React.FormEvent, moduleId: string) {
    e.preventDefault();
    if (!lessonForm.title.trim()) return;
    setSaving(true);
    try {
      await api.createLesson(moduleId, {
        title: lessonForm.title.trim(),
        type: lessonForm.type,
        contentUrl: lessonForm.contentUrl || undefined,
        body: lessonForm.body || undefined,
      });
      setLessonForm({ title: '', type: 'TEXT', contentUrl: '', body: '' });
      setAddingLesson(null);
      reload();
    } finally { setSaving(false); }
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm('Delete this lesson?')) return;
    await api.deleteLesson(id);
    reload();
  }

  const modules: any[] = course.modules ?? [];

  return (
    <div className="space-y-4">
      {/* Module list */}
      {modules.length === 0 && !addingModule && (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <Books className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No modules yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add a module to start structuring the course content.</p>
        </div>
      )}

      {modules.map((mod: any, idx: number) => {
        const isOpen = expanded[mod.id] ?? true;
        const Icon = isOpen ? CaretDown : CaretRight;
        return (
          <div key={mod.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/30 border-b border-border">
              <button onClick={() => setExpanded((p) => ({ ...p, [mod.id]: !isOpen }))} className="text-muted-foreground hover:text-foreground">
                <Icon className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide w-6">M{idx + 1}</span>
              <p className="flex-1 font-semibold text-foreground text-sm">{mod.title}</p>
              <span className="text-xs text-muted-foreground">{mod.lessons?.length ?? 0} lesson{mod.lessons?.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { setAddingLesson(mod.id); setExpanded((p) => ({ ...p, [mod.id]: true })); }}
                className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add lesson
              </button>
              <button onClick={() => handleDeleteModule(mod.id)} className="rounded-lg p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors">
                <Trash className="h-4 w-4" />
              </button>
            </div>

            {/* Lessons */}
            {isOpen && (
              <div className="divide-y divide-border">
                {(mod.lessons ?? []).map((lesson: any, li: number) => {
                  const LIcon = LESSON_ICONS[lesson.type] ?? Article;
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10">
                      <span className="text-xs text-muted-foreground w-6 text-right">{li + 1}</span>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${LESSON_COLORS[lesson.type] ?? 'bg-muted text-muted-foreground'}`}>
                        <LIcon className="h-3.5 w-3.5" />
                      </div>
                      <p className="flex-1 text-sm text-foreground">{lesson.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{lesson.type}</span>
                      {lesson.contentUrl && (
                        <a href={lesson.contentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                          View
                        </a>
                      )}
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="rounded-lg p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add lesson inline form */}
                {addingLesson === mod.id && (
                  <form onSubmit={(e) => handleAddLesson(e, mod.id)} className="px-5 py-4 bg-primary/5 space-y-3">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">New lesson</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        required
                        autoFocus
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Lesson title"
                        className="col-span-2 h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                        <select value={lessonForm.type} onChange={(e) => setLessonForm((f) => ({ ...f, type: e.target.value as any }))}
                          className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="TEXT">Text / Notes</option>
                          <option value="VIDEO">Video</option>
                          <option value="PDF">PDF</option>
                        </select>
                      </div>
                      {lessonForm.type !== 'TEXT' && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            {lessonForm.type === 'VIDEO' ? 'Video URL' : 'PDF URL'}
                          </label>
                          <input
                            value={lessonForm.contentUrl}
                            onChange={(e) => setLessonForm((f) => ({ ...f, contentUrl: e.target.value }))}
                            placeholder="https://…"
                            className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      )}
                      {lessonForm.type === 'TEXT' && (
                        <div className="col-span-2">
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">Content (markdown)</label>
                          <textarea
                            value={lessonForm.body}
                            onChange={(e) => setLessonForm((f) => ({ ...f, body: e.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            placeholder="Lesson content…"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        {saving ? <CircleNotch className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Save lesson
                      </button>
                      <button type="button" onClick={() => setAddingLesson(null)}
                        className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add module */}
      {addingModule ? (
        <form onSubmit={handleAddModule} className="flex items-center gap-3">
          <input
            autoFocus
            required
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Module title (e.g. Pharmacology, Cardiovascular)"
            className="flex-1 h-10 rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Add
          </button>
          <button type="button" onClick={() => setAddingModule(false)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAddingModule(true)}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 px-5 py-3 text-sm font-medium text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors w-full"
        >
          <Plus className="h-4 w-4" /> Add module
        </button>
      )}
    </div>
  );
}

// ── Questions Tab ─────────────────────────────────────────────────────────────

function QuestionsTab({ course, reload }: { course: any; reload: () => void }) {
  const [selectedBank, setSelectedBank] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ title: '', examType: course.examType ?? 'NCLEX', locale: course.locale ?? 'en' });
  const [showQForm, setShowQForm] = useState(false);
  const [qForm, setQForm] = useState({ stem: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', topic: '' });
  const [saving, setSaving] = useState(false);

  async function loadQuestions(bank: any) {
    setSelectedBank(bank);
    setLoadingQ(true);
    try { setQuestions(await api.getQuestions(bank.id) ?? []); } finally { setLoadingQ(false); }
  }

  async function handleCreateBank(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createQuestionBank({ ...bankForm, courseId: course.id, locale: bankForm.locale as 'en' | 'fr' });
      setShowBankForm(false);
      setBankForm({ title: '', examType: course.examType, locale: course.locale });
      reload();
    } finally { setSaving(false); }
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBank) return;
    setSaving(true);
    try {
      await api.createQuestion(selectedBank.id, {
        stem: qForm.stem,
        options: qForm.options.filter(Boolean),
        correctIndex: qForm.correctIndex,
        explanation: qForm.explanation || undefined,
        topic: qForm.topic || undefined,
      });
      setQForm({ stem: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', topic: '' });
      setShowQForm(false);
      await loadQuestions(selectedBank);
    } finally { setSaving(false); }
  }

  const banks: any[] = course.questionBanks ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Banks list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Question Banks</p>
          <button onClick={() => setShowBankForm(true)}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3 w-3" /> New bank
          </button>
        </div>

        {showBankForm && (
          <form onSubmit={handleCreateBank} className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <input required value={bankForm.title} onChange={(e) => setBankForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Bank title" className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="grid grid-cols-2 gap-2">
              <select value={bankForm.examType} onChange={(e) => setBankForm((f) => ({ ...f, examType: e.target.value }))}
                className="h-9 rounded-xl border border-border bg-white px-2 text-sm outline-none">
                {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={bankForm.locale} onChange={(e) => setBankForm((f) => ({ ...f, locale: e.target.value }))}
                className="h-9 rounded-xl border border-border bg-white px-2 text-sm outline-none">
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create bank'}
              </button>
              <button type="button" onClick={() => setShowBankForm(false)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
                Cancel
              </button>
            </div>
          </form>
        )}

        {banks.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
            <p className="text-xs text-muted-foreground">No question banks yet.</p>
          </div>
        ) : (
          banks.map((bank: any) => (
            <button
              key={bank.id}
              onClick={() => loadQuestions(bank)}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedBank?.id === bank.id ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/40'}`}
            >
              <p className="text-sm font-semibold text-foreground truncate">{bank.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 font-bold uppercase">{bank.examType}</span>
                <span>{bank._count?.questions ?? 0} questions</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Questions panel */}
      <div className="lg:col-span-2 space-y-4">
        {!selectedBank ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Select a question bank to view and add questions.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{selectedBank.title}</p>
              <button onClick={() => setShowQForm((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add question
              </button>
            </div>

            {/* Add question form */}
            {showQForm && (
              <form onSubmit={handleCreateQuestion} className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Question stem *</label>
                  <textarea required value={qForm.stem} onChange={(e) => setQForm((f) => ({ ...f, stem: e.target.value }))}
                    rows={3} className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="A nurse is caring for a patient who…" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">Answer options (A–D) *</label>
                  {['A', 'B', 'C', 'D'].map((letter, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name="correct" checked={qForm.correctIndex === i}
                        onChange={() => setQForm((f) => ({ ...f, correctIndex: i }))} className="h-4 w-4 accent-primary" />
                      <span className="w-5 text-xs font-bold text-muted-foreground">{letter}</span>
                      <input required value={qForm.options[i]} onChange={(e) => setQForm((f) => { const opts = [...f.options]; opts[i] = e.target.value; return { ...f, options: opts }; })}
                        placeholder={`Option ${letter}`}
                        className="flex-1 h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pl-7">Select the radio button for the correct answer.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Topic (optional)</label>
                    <input value={qForm.topic} onChange={(e) => setQForm((f) => ({ ...f, topic: e.target.value }))}
                      placeholder="e.g. Pharmacology" className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Explanation (optional)</label>
                    <input value={qForm.explanation} onChange={(e) => setQForm((f) => ({ ...f, explanation: e.target.value }))}
                      placeholder="Rationale…" className="h-9 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                    {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Save question
                  </button>
                  <button type="button" onClick={() => setShowQForm(false)}
                    className="rounded-xl border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted">Cancel</button>
                </div>
              </form>
            )}

            {/* Questions list */}
            {loadingQ ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : questions.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No questions yet. Add the first one above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q: any, qi: number) => (
                  <div key={q.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {qi + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{q.stem}</p>
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          {(q.options as string[]).map((opt, oi) => (
                            <div key={oi} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs ${oi === q.correctIndex ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-muted-foreground'}`}>
                              <span className="font-bold">{['A', 'B', 'C', 'D'][oi]}.</span> {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && <p className="mt-2 text-xs text-muted-foreground italic">{q.explanation}</p>}
                      </div>
                      {q.topic && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">{q.topic}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Students Tab ──────────────────────────────────────────────────────────────

function StudentsTab({ course }: { course: any }) {
  const enrollments: any[] = course.enrollments ?? [];

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">No students enrolled</p>
        <p className="mt-1 text-xs text-muted-foreground">Students enroll through the client portal.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b border-border">
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-5 py-3 font-semibold">Student</th>
            <th className="px-5 py-3 font-semibold">Profession</th>
            <th className="px-5 py-3 font-semibold">Progress</th>
            <th className="px-5 py-3 font-semibold">Enrolled</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {enrollments.map((enr: any) => (
            <tr key={enr.id} className="hover:bg-muted/10">
              <td className="px-5 py-3">
                <p className="font-medium text-foreground">{enr.person?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{enr.person?.email ?? '—'}</p>
              </td>
              <td className="px-5 py-3 text-xs text-muted-foreground capitalize">{enr.person?.profession ?? '—'}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[120px]">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${enr.progressPct ?? 0}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{Math.round(enr.progressPct ?? 0)}%</span>
                </div>
              </td>
              <td className="px-5 py-3 text-xs text-muted-foreground">
                {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </td>
              <td className="px-5 py-3">
                {enr.completedAt ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Completed</span>
                ) : (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">In progress</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab({ course, reload }: { course: any; reload: () => void }) {
  const [form, setForm] = useState({
    title: course.title ?? '',
    description: course.description ?? '',
    examType: course.examType ?? 'NCLEX',
    locale: course.locale ?? 'en',
    durationHours: course.durationHours?.toString() ?? '',
    isPublished: course.isPublished ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateCourse(course.id, {
        title: form.title,
        description: form.description || undefined,
        examType: form.examType,
        locale: form.locale,
        durationHours: form.durationHours ? parseFloat(form.durationHours) : undefined,
        isPublished: form.isPublished,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      reload();
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Title</label>
        <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">Exam type</label>
          <select value={form.examType} onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
            {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">Language</label>
          <select value={form.locale} onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
            className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Duration (hours)</label>
        <input type="number" min="0" step="0.5" value={form.durationHours} onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))}
          className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <input type="checkbox" id="pub" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
          className="h-4 w-4 rounded accent-primary" />
        <label htmlFor="pub" className="text-sm font-medium text-foreground">Published (visible to students)</label>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4" /> Course updated successfully.
        </div>
      )}

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Save changes
      </button>
    </form>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────

const SESSION_STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: 'Scheduled', cls: 'bg-amber-100 text-amber-700' },
  LIVE:      { label: 'Live',      cls: 'bg-emerald-100 text-emerald-700 animate-pulse' },
  COMPLETED: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-muted text-muted-foreground' },
};

function SessionsTab({ course }: { course: any }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', scheduledAt: '', durationMins: '60' });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try { setSessions(await api.getCourseSessions(course.id) ?? []); }
    finally { setLoadingSessions(false); }
  };

  useEffect(() => { loadSessions(); }, [course.id]);

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.scheduleLiveSession(course.id, {
        title: form.title,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMins: parseInt(form.durationMins, 10),
      });
      setForm({ title: '', scheduledAt: '', durationMins: '60' });
      setShowForm(false);
      await loadSessions();
    } finally { setSaving(false); }
  }

  async function handleStart(id: string) {
    setActionLoading(id + '-start');
    try {
      const res = await api.startLiveSession(id);
      await loadSessions();
      if (res.meetingUrl) window.open(res.meetingUrl, '_blank');
    } finally { setActionLoading(null); }
  }

  async function handleEnd(id: string) {
    if (!confirm('End this live session?')) return;
    setActionLoading(id + '-end');
    try { await api.endLiveSession(id); await loadSessions(); }
    finally { setActionLoading(null); }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this session? This cannot be undone.')) return;
    setActionLoading(id + '-cancel');
    try { await api.cancelLiveSession(id); await loadSessions(); }
    finally { setActionLoading(null); }
  }

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="space-y-5">
      {/* Schedule form */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Live Sessions</p>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Schedule session
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSchedule} className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">New live session</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Session title</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. NCLEX Pharmacology Review"
              className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Date & time</label>
              <input required type="datetime-local" value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration</label>
              <select value={form.durationMins} onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Schedule
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-xl border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sessions list */}
      {loadingSessions ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <CalendarBlank className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No sessions scheduled</p>
          <p className="mt-1 text-xs text-muted-foreground">Schedule the first live session above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s: any) => {
            const badge = SESSION_STATUS[s.status] ?? { label: s.status, cls: 'bg-muted text-muted-foreground' };
            const dt = s.scheduledAt ? new Date(s.scheduledAt) : null;
            const isLive = s.status === 'LIVE';
            const isScheduled = s.status === 'SCHEDULED';
            const isDone = s.status === 'COMPLETED' || s.status === 'CANCELLED';
            return (
              <div key={s.id} className={`rounded-2xl border bg-white shadow-sm ${isLive ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-border'}`}>
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isLive ? 'bg-emerald-100' : 'bg-muted/50'}`}>
                    <CalendarBlank className={`h-5 w-5 ${isLive ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{s.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {dt && (
                        <span className="flex items-center gap-1">
                          <CalendarBlank className="h-3.5 w-3.5" />
                          {dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}
                          {dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {s.durationMins ?? 60} min
                      </span>
                    </div>

                    {/* Meeting URL row */}
                    {s.meetingUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <a href={s.meetingUrl} target="_blank" rel="noreferrer"
                          className="truncate text-xs text-primary hover:underline max-w-[320px]">
                          {s.meetingUrl}
                        </a>
                        <button onClick={() => copyLink(s.meetingUrl, s.id)}
                          className="flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-xs text-foreground hover:bg-muted/70 transition-colors">
                          <LinkSimple className="h-3 w-3" />
                          {copiedId === s.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isScheduled && (
                      <button
                        onClick={() => handleStart(s.id)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === s.id + '-start' ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        Start
                      </button>
                    )}
                    {isLive && (
                      <>
                        <a href={s.meetingUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                          <Play className="h-3.5 w-3.5" /> Join
                        </a>
                        <button
                          onClick={() => handleEnd(s.id)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === s.id + '-end' ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Stop className="h-3.5 w-3.5" />}
                          End
                        </button>
                      </>
                    )}
                    {!isDone && (
                      <button
                        onClick={() => handleCancel(s.id)}
                        disabled={!!actionLoading}
                        className="rounded-xl border border-border p-1.5 text-muted-foreground hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === s.id + '-cancel' ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'content' | 'questions' | 'students' | 'sessions' | 'settings';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'content',   label: 'Content',   icon: BookOpen },
  { key: 'questions', label: 'Questions', icon: Books },
  { key: 'students',  label: 'Students',  icon: Users },
  { key: 'sessions',  label: 'Sessions',  icon: CalendarBlank },
  { key: 'settings',  label: 'Settings',  icon: Gear },
];

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('content');

  const load = useCallback(async () => {
    try {
      const data = await api.getCourse(id);
      setCourse(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const totalLessons = course?.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/courses')} className="mt-1 rounded-xl border border-border p-2 hover:bg-muted/50 transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-48" /></div>
          ) : error ? (
            <div className="flex items-center gap-2 text-rose-600"><Warning className="h-5 w-5" />{error}</div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground truncate">{course.title}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${course.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.examType} · {course.locale === 'fr' ? 'Français' : 'English'} · {course.modules?.length ?? 0} modules · {totalLessons} lessons · {course.enrollments?.length ?? 0} students
              </p>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!loading && !error && (
        <>
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="h-4 w-4" />
                {label}
                {key === 'students' && course.enrollments?.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{course.enrollments.length}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'content'   && <ContentTab   course={course} reload={load} />}
          {tab === 'questions' && <QuestionsTab  course={course} reload={load} />}
          {tab === 'students'  && <StudentsTab   course={course} />}
          {tab === 'sessions'  && <SessionsTab   course={course} />}
          {tab === 'settings'  && <SettingsTab   course={course} reload={load} />}
        </>
      )}
    </div>
  );
}

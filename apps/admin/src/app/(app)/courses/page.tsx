'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@mjn/ui';
import {
  CircleNotch, Plus, CheckCircle, BookOpen, ArrowRight,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const EXAM_TYPES = ['NCLEX', 'HAAD', 'DHA', 'CBT', 'DA', 'NMC', 'CGFNS'];

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    locale: 'en' as 'en' | 'fr',
    examType: 'NCLEX',
    durationHours: '',
    isPublished: false,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getCoursesAdmin();
      setCourses(data ?? []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCourse({
        title: form.title,
        description: form.description || undefined,
        locale: form.locale,
        examType: form.examType,
        durationHours: form.durationHours ? parseFloat(form.durationHours) : undefined,
        isPublished: form.isPublished,
      });
      showToast('Course created!');
      setShowForm(false);
      setForm({ title: '', description: '', locale: 'en', examType: 'NCLEX', durationHours: '', isPublished: false });
      load();
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(course: any) {
    try {
      await api.updateCourse(course.id, { isPublished: !course.isPublished });
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, isPublished: !c.isPublished } : c));
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Academy Courses" subtitle={`${courses.length} courses in system`} />
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New course
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <p className="text-sm text-emerald-700">{toast}</p>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h3 className="mb-4 font-semibold text-foreground">New Course</h3>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="NCLEX-RN Comprehensive Review"
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Exam type</label>
              <select
                value={form.examType}
                onChange={(e) => setForm({ ...form, examType: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
              >
                {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Locale</label>
              <select
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value as 'en' | 'fr' })}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Duration (hours)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.durationHours}
                onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="published"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="published" className="text-sm font-medium text-foreground">Publish immediately</label>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Create course
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No courses yet. Create your first course above.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Exam</th>
                <th className="px-4 py-3 font-medium">Locale</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Banks</th>
                <th className="px-4 py-3 font-medium">Enrolled</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((course: any) => (
                <tr key={course.id} onClick={() => router.push('/courses/' + course.id)} className="hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <span className="flex items-center gap-1 group">
                      {course.title}
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold uppercase text-blue-700">
                      {course.examType}
                    </span>
                  </td>
                  <td className="px-4 py-3 uppercase text-muted-foreground text-xs">{course.locale}</td>
                  <td className="px-4 py-3 text-muted-foreground">{course.durationHours ?? '—'}h</td>
                  <td className="px-4 py-3 text-muted-foreground">{course.questionBanks?.length ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{course.enrollments?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(course)}
                      className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide transition ${
                        course.isPublished ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-muted text-muted-foreground hover:bg-slate-200'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

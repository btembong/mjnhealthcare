import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class AIService {
  private readonly client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Conversation history helpers ──────────────────────────────────────────

  async getConversation(personId: string, surface: string) {
    const conv = await this.db.aiConversation.findFirst({
      where: { personId, surface },
      orderBy: { updatedAt: 'desc' },
    });
    return conv ? (conv.messages as { role: 'user' | 'assistant'; content: string }[]) : [];
  }

  async saveConversation(personId: string, surface: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
    const existing = await this.db.aiConversation.findFirst({ where: { personId, surface } });
    if (existing) {
      return this.db.aiConversation.update({ where: { id: existing.id }, data: { messages: messages as any } });
    }
    return this.db.aiConversation.create({ data: { personId, surface, messages: messages as any } });
  }

  async clearConversation(personId: string, surface: string) {
    await this.db.aiConversation.deleteMany({ where: { personId, surface } });
    return { ok: true };
  }

  // ── Study Assistant ───────────────────────────────────────────────────────

  async studyAssistantChat(
    personId: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    locale: 'en' | 'fr',
  ) {
    // Load person's enrollment context
    const person = await this.db.person.findUnique({
      where: { id: personId },
      include: {
        engagements: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: { milestones: true },
        },
      },
    });

    // Find active study plan
    const studyPlan = await this.db.studyPlan.findFirst({
      where: { personId },
      include: { items: { where: { completed: false }, orderBy: { dueDate: 'asc' }, take: 3 } },
    });

    // Find weak areas from recent practice results
    const recentPractice = await this.db.practiceResult.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const topicScores: Record<string, { total: number; correct: number }> = {};
    recentPractice.forEach((r) => {
      if (!r.topic) return;
      if (!topicScores[r.topic]) topicScores[r.topic] = { total: 0, correct: 0 };
      topicScores[r.topic].total += r.total;
      topicScores[r.topic].correct += r.score;
    });
    const weakAreas = Object.entries(topicScores)
      .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.65)
      .map(([topic, v]) => ({ topic, pct: Math.round((v.correct / v.total) * 100) }))
      .slice(0, 3);

    const examContext = person?.engagements?.[0]?.milestones?.map((m) => m.label).join(', ') ?? '';
    const nextStudyItems = studyPlan?.items?.map((i) => i.topic).join(', ') ?? '';
    const weakAreasText = weakAreas.map((w) => `${w.topic} (${w.pct}%)`).join(', ');

    const system =
      locale === 'fr'
        ? `Tu es un tuteur expert en préparation aux examens médicaux (NCLEX, CBT, HAAD, DHA, DA). Réponds en français. Ne fais pas de prédictions sur le taux de réussite — oriente vers un consultant humain pour cela.
${examContext ? `Contexte de l'apprenant: ${examContext}.` : ''}
${nextStudyItems ? `Prochains sujets du plan d'étude: ${nextStudyItems}.` : ''}
${weakAreasText ? `Domaines faibles à renforcer: ${weakAreasText}.` : ''}
Commence par les lacunes identifiées quand c'est pertinent.`
        : `You are an expert tutor for healthcare licensing exams (NCLEX, CBT, HAAD, DHA, DA). Do not predict pass likelihood — direct those questions to a human consultant.
${examContext ? `Learner context: ${examContext}.` : ''}
${nextStudyItems ? `Upcoming study plan topics: ${nextStudyItems}.` : ''}
${weakAreasText ? `Weak areas to prioritise: ${weakAreasText}.` : ''}
Proactively reference weak areas when relevant.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages,
    });

    // Persist conversation
    await this.saveConversation(personId, 'study_assistant', messages.concat([
      { role: 'assistant', content: response.content[0].type === 'text' ? response.content[0].text : '' },
    ]));

    return { content: response.content[0], requiresReview: false };
  }

  // ── Case Status Bot (portal — grounded in real data) ─────────────────────

  async caseChatMessage(
    personId: string,
    engagementId: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ) {
    // Load real case data
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      include: {
        person: { select: { name: true, profession: true } },
        milestones: { orderBy: { createdAt: 'desc' } },
        orders: { include: { lineItems: true } },
        licensingProgress: { include: { currentStage: true } },
        caseNotes: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        applicationTracking: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    if (!engagement) throw new Error('Engagement not found');

    const docs = await this.db.document.findMany({ where: { personId: engagement.personId } });
    const pendingDocs = docs.filter((d) => d.status === 'PENDING');
    const rejectedDocs = docs.filter((d) => d.status === 'REJECTED');
    const verifiedDocs = docs.filter((d) => d.status === 'VERIFIED');
    const orders = engagement.orders ?? [];
    const unpaidOrders = orders.filter((o) => o.status !== 'PAID');
    const latestTracking = engagement.applicationTracking?.[0];
    const recentUpdates = engagement.caseNotes?.map((n) => n.content).join('\n- ') ?? '';
    const milestones = engagement.milestones ?? [];
    const completedMilestones = milestones.filter((m: any) => m.completedAt);

    const system = `You are the MJN Healthcare case assistant helping ${engagement.person?.name ?? 'the client'} understand the status of their case. Answer ONLY based on the real data below — do not generate or guess information not present.

CASE DATA:
- Case reference: ENG-${engagementId.slice(-6).toUpperCase()}
- Status: ${engagement.status}
- Engagement letter: ${engagement.letterSignedAt ? 'Signed' : 'Not yet signed'}
- Profession: ${engagement.person?.profession ?? 'Not specified'}

DOCUMENTS (${docs.length} total):
- Verified: ${verifiedDocs.length} — ${verifiedDocs.map((d) => d.type).join(', ') || 'none'}
- Pending review: ${pendingDocs.length} — ${pendingDocs.map((d) => d.type).join(', ') || 'none'}
- Rejected (needs re-upload): ${rejectedDocs.length} — ${rejectedDocs.map((d) => d.type?.replace(/_/g, ' ')).join(', ') || 'none'}

MILESTONES: ${milestones.length} total, ${completedMilestones.length} completed
${milestones.map((m: any) => `- ${m.label}: ${m.completedAt ? 'Done' : 'Pending'}`).join('\n')}

PAYMENTS: ${unpaidOrders.length > 0 ? `${unpaidOrders.length} outstanding order(s)` : 'All payments up to date'}

LATEST TRACKING: ${latestTracking ? `${latestTracking.status} — ${latestTracking.notes ?? ''}` : 'No tracking entries yet'}

RECENT UPDATES FROM TEAM:
${recentUpdates || 'No updates yet'}

RULES:
- Do not predict outcomes (exam pass, visa approval, job offer)
- For specific questions you cannot answer from this data, say "Please contact your consultant for more details"
- Be warm, concise, and professional
- If there are rejected documents, make that your top priority message`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system,
      messages,
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    // Persist
    await this.saveConversation(personId, 'case_bot', messages.concat([{ role: 'assistant', content }]));

    return { content };
  }

  // ── Draft Client Update (auto-context from real case data) ────────────────

  async draftClientUpdate(engagementId: string, context?: string): Promise<{ draftId: string; draft: string }> {
    // Auto-fetch live case context if not provided
    let autoContext = context ?? '';
    if (!context) {
      const engagement = await this.db.engagement.findUnique({
        where: { id: engagementId },
        include: {
          person: { select: { name: true, profession: true } },
          milestones: { orderBy: { createdAt: 'desc' }, take: 5 },
          applicationTracking: { orderBy: { createdAt: 'desc' }, take: 3 },
          caseNotes: { where: { isInternal: true }, orderBy: { createdAt: 'desc' }, take: 3 },
        },
      });

      if (engagement) {
        const engDocs = await this.db.document.findMany({ where: { personId: engagement.personId }, orderBy: { uploadedAt: 'desc' }, take: 10 });
        const pendingDocs = engDocs.filter((d) => d.status === 'PENDING');
        const rejectedDocs = engDocs.filter((d) => d.status === 'REJECTED');
        const latestTracking = engagement.applicationTracking?.[0];
        const completedMilestones = (engagement.milestones ?? []).filter((m: any) => m.completedAt);
        const recentNotes = (engagement.caseNotes ?? []).map((n) => n.content).join(' | ');

        autoContext = `Client: ${engagement.person?.name ?? 'Unknown'} (${engagement.person?.profession ?? ''})
Case status: ${engagement.status}
Milestones: ${completedMilestones.length}/${(engagement.milestones ?? []).length} completed — latest: ${engagement.milestones?.[0]?.label ?? 'none'}
Documents: ${pendingDocs.length} pending review, ${rejectedDocs.length} rejected (${rejectedDocs.map((d) => d.type?.replace(/_/g, ' ')).join(', ') || 'none'})
Latest tracking: ${latestTracking ? `${latestTracking.status} — ${latestTracking.notes ?? ''}` : 'none'}
Recent internal notes: ${recentNotes || 'none'}
Draft a concise, warm, professional client status update based on this. Do not include speculation about outcomes.`;
      }
    }

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are drafting a client status update for a healthcare consulting agency. Be professional, warm, and concise. This draft MUST be reviewed by a consultant before sending.',
      messages: [{ role: 'user', content: autoContext }],
    });

    const draft = response.content[0].type === 'text' ? response.content[0].text : '';

    const record = await this.db.aiDraft.create({
      data: { engagementId, draft, requiresReview: true },
    });

    return { draftId: record.id, draft };
  }

  // ── Case Summary (for consultants picking up a case) ──────────────────────

  async summariseCase(engagementId: string): Promise<{ summary: string }> {
    const engagement = await this.db.engagement.findUnique({
      where: { id: engagementId },
      include: {
        person: { select: { name: true, profession: true, email: true } },
        milestones: { orderBy: { createdAt: 'asc' } },
        orders: true,
        applicationTracking: { orderBy: { createdAt: 'desc' }, take: 5 },
        caseNotes: { orderBy: { createdAt: 'desc' }, take: 10 },
        escalations: { where: { resolvedAt: null } },
      },
    });

    if (!engagement) throw new Error('Engagement not found');

    const docs = await this.db.document.findMany({ where: { personId: engagement.personId } });
    const notes = (engagement.caseNotes ?? [])
      .map((n: any) => n.content)
      .join('\n');
    const tracking = (engagement.applicationTracking ?? [])
      .map((t: any) => `${t.status}${t.notes ? ': ' + t.notes : ''}`)
      .join(', ');
    const milestones = (engagement.milestones ?? [])
      .map((m: any) => `${m.label}: ${m.completedAt ? 'Done' : 'Pending'}`)
      .join('\n');
    const openEscalations = engagement.escalations?.length ?? 0;

    const prompt = `Summarise this client case into a concise briefing for a consultant. Be factual, highlight what needs attention, and keep it under 200 words.

Client: ${engagement.person?.name} — ${engagement.person?.profession} — ${engagement.person?.email}
Status: ${engagement.status}
Documents: ${docs.filter((d) => d.status === 'VERIFIED').length} verified, ${docs.filter((d) => d.status === 'PENDING').length} pending, ${docs.filter((d) => d.status === 'REJECTED').length} rejected
Open escalations: ${openEscalations}
Milestones:\n${milestones}
Latest tracking: ${tracking || 'none'}
Recent notes:\n${notes || 'none'}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: 'You are a concise case briefing assistant for a healthcare consulting agency. Produce bullet-point briefings that let a consultant understand a case in 30 seconds.',
      messages: [{ role: 'user', content: prompt }],
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';
    return { summary };
  }

  // ── Document Pre-screening ────────────────────────────────────────────────

  async prescreenDocument(documentId: string): Promise<{ flags: string[]; summary: string; confidence: 'high' | 'medium' | 'low' }> {
    const doc = await this.db.document.findUnique({
      where: { id: documentId },
      include: { person: { select: { name: true, profession: true } } },
    });

    if (!doc) throw new Error('Document not found');

    const prompt = `A healthcare professional (${doc.person?.profession ?? 'unknown profession'}) uploaded a document of type: ${doc.type?.replace(/_/g, ' ')}.
File URL: ${doc.fileUrl}
Uploaded: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'unknown'}
Expiry date on file: ${doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'none recorded'}

Based on the document type, list common issues to watch for during verification. Flag any concerns based on the metadata available. Be specific about what a compliance reviewer should check.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: `You are a document pre-screening assistant for a healthcare licensing agency.
For the given document type, list what compliance reviewers must check. Flag: missing expiry dates, wrong document type, documents likely to be expired, known format issues for this credential type.
Output JSON: { "flags": ["flag1", "flag2"], "summary": "one sentence summary", "confidence": "high|medium|low" }
Respond with ONLY valid JSON.`,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return {
        flags: parsed.flags ?? [],
        summary: parsed.summary ?? 'Pre-screening complete.',
        confidence: parsed.confidence ?? 'medium',
      };
    } catch {
      return { flags: [], summary: 'Pre-screening complete — manual review required.', confidence: 'low' };
    }
  }

  // ── Approve draft ─────────────────────────────────────────────────────────

  async approveDraft(draftId: string, reviewedBy: string) {
    return this.db.aiDraft.update({
      where: { id: draftId },
      data: { reviewedBy, approvedAt: new Date() },
    });
  }

  async getPendingDrafts() {
    return this.db.aiDraft.findMany({
      where: { requiresReview: true, approvedAt: null },
      include: { engagement: { include: { person: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Support bot (public — marketing site widget) ──────────────────────────

  async supportChat(
    messages: { role: 'user' | 'assistant'; content: string }[],
    leadContext?: { name?: string; email?: string; profession?: string; destination?: string },
  ) {
    const system = `You are the MJN Healthcare support assistant. MJN Health Academy and Professional Services helps healthcare professionals (nurses, physicians, allied health) get licensed internationally — UAE, UK, US, Ireland — and prepares them for licensure exams (NCLEX, HAAD, DHA, CBT, DA).

Key facts:
- Services: Global placement & licensing support, Academy exam prep, Student support (internships, study abroad)
- Engagement fee: $50 (mandatory), full service pricing on consultation
- Contact: consultations can be booked at /get-started
- You do NOT predict exam pass rates, visa approval odds, or job offer outcomes — always refer those to a consultant

When a user seems ready to proceed, encourage them to book a free consultation. Be warm, professional, and concise. If they share their name, profession, or destination, acknowledge it personally.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system,
      messages,
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    if (leadContext?.email && messages.length >= 4) {
      const existing = await this.db.lead.findFirst({ where: { email: leadContext.email } });
      await this.db.lead.upsert({
        where: { email: leadContext.email } as never,
        update: {
          name: leadContext.name ?? undefined,
          profession: leadContext.profession ?? undefined,
          destination: leadContext.destination ?? undefined,
        },
        create: {
          email: leadContext.email,
          name: leadContext.name ?? 'Unknown',
          profession: leadContext.profession,
          destination: leadContext.destination,
          serviceInterest: 'Support bot',
        },
      });
      if (!existing) {
        this.events.emit('lead.created', {
          name: leadContext.name ?? 'Unknown',
          email: leadContext.email,
          profession: leadContext.profession,
          destination: leadContext.destination,
          source: 'Support bot',
        });
      }
    }

    return { content };
  }
}

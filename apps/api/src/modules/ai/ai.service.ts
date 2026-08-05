import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { DatabaseService } from '@mjn/database';

const REVIEW_REQUIRED_TOPICS = ['licensing', 'visa', 'exam eligibility', 'pass rate'];

@Injectable()
export class AIService {
  private readonly client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(private readonly db: DatabaseService) {}

  async studyAssistantChat(personId: string, messages: { role: 'user' | 'assistant'; content: string }[], locale: 'en' | 'fr') {
    const system =
      locale === 'fr'
        ? 'Tu es un tuteur expert en préparation aux examens médicaux (NCLEX, CBT, HAAD, DHA, DA). Réponds en français. Ne fais pas de prédictions sur le taux de réussite — oriente vers un consultant humain pour cela.'
        : 'You are an expert tutor for healthcare licensing exams (NCLEX, CBT, HAAD, DHA, DA). Do not predict pass likelihood — direct those questions to a human consultant.';

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages,
    });

    return { content: response.content[0], requiresReview: false };
  }

  async draftClientUpdate(engagementId: string, context: string): Promise<{ draftId: string; draft: string }> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are drafting a client status update for a healthcare consulting agency. Be professional and concise. This draft MUST be reviewed by a consultant before sending.',
      messages: [{ role: 'user', content: context }],
    });

    const draft = response.content[0].type === 'text' ? response.content[0].text : '';

    // Store draft — requires consultant review before send
    const record = await this.db.aiDraft.create({
      data: { engagementId, draft, requiresReview: true },
    });

    return { draftId: record.id, draft };
  }

  async approveDraft(draftId: string, reviewedBy: string) {
    return this.db.aiDraft.update({
      where: { id: draftId },
      data: { reviewedBy, approvedAt: new Date() },
    });
  }

  async getPendingDrafts() {
    return this.db.aiDraft.findMany({
      where: { requiresReview: true, approvedAt: null },
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

    // If we have lead context and conversation has enough length, capture as lead
    if (leadContext?.email && messages.length >= 4) {
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
    }

    return { content };
  }
}

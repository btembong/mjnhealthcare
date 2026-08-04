import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class LeadService {
  constructor(
    private readonly db: DatabaseService,
    private readonly events: EventEmitter2,
  ) {}

  async createLead(data: {
    name: string;
    email: string;
    phone?: string;
    profession?: string;
    destination?: string;
    serviceInterest?: string;
    notes?: string;
  }) {
    const lead = await this.db.lead.create({ data });
    this.events.emit('lead.created', { leadId: lead.id, name: lead.name, email: lead.email });
    return lead;
  }

  async bookConsultation(data: {
    name: string;
    email: string;
    phone?: string;
    profession?: string;
    destination?: string;
    serviceInterest?: string;
    slotId: string;
    selectedServices?: string;
    estimate?: string;
    lang?: string;
  }) {
    let slot = await this.db.bookingSlot.findUnique({ where: { id: data.slotId } });

    // Handle mock slot IDs (format: mock-{YYYY-MM-DD}-{index}) — create a real slot on the fly
    if (!slot && data.slotId.startsWith('mock-')) {
      const times = [['09:00', '09:30'], ['11:00', '11:30'], ['14:00', '14:30'], ['16:00', '16:30']];
      const parts = data.slotId.split('-'); // ['mock', 'YYYY', 'MM', 'DD', 'index']
      const dateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
      const idx = parseInt(parts[4] ?? '0', 10);
      const [startT, endT] = times[idx] ?? times[0];
      slot = await this.db.bookingSlot.create({
        data: {
          id: data.slotId,
          resourceId: 'general-consultation',
          date: new Date(`${dateStr}T00:00:00.000Z`),
          startTime: new Date(`${dateStr}T${startT}:00.000Z`),
          endTime: new Date(`${dateStr}T${endT}:00.000Z`),
          isBooked: false,
        },
      });
    }

    if (!slot || slot.isBooked) throw new NotFoundException('Slot not available');

    const { slotId, selectedServices, estimate, lang, ...leadData } = data;

    // Store selected services and estimate in the notes field for consultant visibility
    const noteParts: string[] = [];
    if (estimate) noteParts.push(`Estimate: ${estimate}`);
    if (selectedServices) noteParts.push(`Services: ${selectedServices}`);
    if (lang && lang !== 'en') noteParts.push(`Language preference: ${lang}`);
    if (noteParts.length) leadData.serviceInterest = leadData.serviceInterest ?? undefined;

    const lead = await this.db.lead.create({
      data: {
        ...leadData,
        ...(noteParts.length && { notes: noteParts.join(' | ') }),
      },
    });

    const booking = await this.db.booking.create({
      data: { leadId: lead.id, slotId, type: 'consultation', status: 'CONFIRMED' },
    });
    await this.db.bookingSlot.update({ where: { id: slotId }, data: { isBooked: true } });

    this.events.emit('lead.consultation_booked', {
      leadId: lead.id,
      bookingId: booking.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      profession: lead.profession,
      destination: lead.destination,
      slotStart: slot.startTime.toISOString(),
      estimate,
      selectedServices,
      lang: lang ?? 'en',
    });

    return { lead, booking };
  }

  async findAll(filters?: { status?: string }) {
    const leads = await this.db.lead.findMany({
      where: filters?.status ? { status: filters.status as any } : undefined,
      include: { bookings: { include: { slot: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Attach consultant names — assignedConsultantId is a raw FK string, no schema relation
    const ids = [...new Set(leads.map((l) => l.assignedConsultantId).filter(Boolean))] as string[];
    const nameMap: Record<string, string> = {};
    if (ids.length) {
      const persons = await this.db.person.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      persons.forEach((p) => { nameMap[p.id] = p.name; });
    }

    return leads.map((l) => ({
      ...l,
      assignedConsultantName: l.assignedConsultantId ? (nameMap[l.assignedConsultantId] ?? null) : null,
    }));
  }

  async updateStatus(id: string, status: string, assignedConsultantId?: string) {
    return this.db.lead.update({
      where: { id },
      data: { status: status as any, ...(assignedConsultantId && { assignedConsultantId }) },
    });
  }

  async convertToEngagement(leadId: string, personId: string) {
    return this.db.lead.update({
      where: { id: leadId },
      data: { status: 'CONVERTED', convertedPersonId: personId },
    });
  }
}

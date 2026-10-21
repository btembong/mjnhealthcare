import { Injectable, Logger } from '@nestjs/common';

interface DailyRoom {
  name: string;
  url: string;
  privacy: string;
}

@Injectable()
export class DailyCoService {
  private readonly logger = new Logger(DailyCoService.name);
  private readonly baseUrl = 'https://api.daily.co/v1';
  private readonly apiKey = process.env.DAILY_CO_API_KEY ?? '';

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async createRoom(bookingId: string, startAt: Date, durationMinutes: number): Promise<DailyRoom> {
    if (!this.apiKey) {
      throw new Error('DAILY_CO_API_KEY is not configured');
    }

    // Room expires 90 minutes after session start to allow overruns
    const exp = Math.floor(startAt.getTime() / 1000) + (durationMinutes + 45) * 60;
    const name = `mjn-consult-${bookingId}`;

    const res = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name,
        privacy: 'private',
        properties: {
          exp,
          max_participants: 2,
          enable_recording: 'cloud',
          autojoin: false,
          enable_prejoin_ui: true,
          enable_network_ui: true,
          lang: 'en',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Daily.co room creation failed: ${err}`);
      throw new Error('Failed to create video room');
    }

    return res.json() as Promise<DailyRoom>;
  }

  /**
   * Makes sure the room for a booking exists and stays open until after the given start time.
   * Used when a session moves, or when the room was never created at booking time.
   */
  async ensureRoom(bookingId: string, startAt: Date, durationMinutes: number): Promise<DailyRoom> {
    if (!this.apiKey) {
      throw new Error('DAILY_CO_API_KEY is not configured');
    }
    const exp = Math.floor(startAt.getTime() / 1000) + (durationMinutes + 45) * 60;
    const res = await fetch(`${this.baseUrl}/rooms/mjn-consult-${bookingId}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ properties: { exp } }),
    });
    if (res.ok) return res.json() as Promise<DailyRoom>;
    return this.createRoom(bookingId, startAt, durationMinutes);
  }

  async deleteRoom(roomName: string): Promise<void> {
    await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
  }

  // ── Webinars: one presenter room, many viewers ──────────────────────────────

  /**
   * A room where only hosts send sound and video; everyone else watches. Creating it again
   * (after the time moves) only updates when it closes.
   */
  async upsertWebinarRoom(name: string, o: { closesAt: Date; capacity: number; lang: 'en' | 'fr' }): Promise<DailyRoom> {
    if (!this.apiKey) throw new Error('DAILY_CO_API_KEY is not configured');
    const properties = {
      exp: Math.floor(o.closesAt.getTime() / 1000),
      max_participants: Math.min(200, o.capacity + 10),
      owner_only_broadcast: true,
      enable_recording: 'cloud',
      enable_chat: true,
      enable_people_ui: false,
      enable_prejoin_ui: false,
      enable_network_ui: true,
      enable_knocking: false,
      lang: o.lang,
    };
    const update = await fetch(`${this.baseUrl}/rooms/${name}`, { method: 'POST', headers: this.headers(), body: JSON.stringify({ properties }) });
    if (update.ok) return update.json() as Promise<DailyRoom>;
    const res = await fetch(`${this.baseUrl}/rooms`, { method: 'POST', headers: this.headers(), body: JSON.stringify({ name, privacy: 'private', properties }) });
    if (!res.ok) {
      this.logger.error(`Daily.co webinar room creation failed: ${await res.text()}`);
      throw new Error('Failed to create the webinar room');
    }
    return res.json() as Promise<DailyRoom>;
  }

  /** A pass into a webinar room. Hosts can speak and the recording starts when one joins; viewers only watch. */
  async webinarToken(roomName: string, o: { host: boolean; userName: string; expiresAt: Date }): Promise<string> {
    const res = await fetch(`${this.baseUrl}/meeting-tokens`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: o.host,
          user_name: o.userName.slice(0, 60),
          exp: Math.floor(o.expiresAt.getTime() / 1000),
          start_video_off: !o.host,
          start_audio_off: !o.host,
          enable_recording_ui: o.host,
          start_cloud_recording: o.host,
        },
      }),
    });
    if (!res.ok) throw new Error('Failed to create a webinar pass');
    const data = await res.json() as { token: string };
    return data.token;
  }

  /** The longest finished recording of a room, if any. */
  async finishedRecording(roomName: string): Promise<{ id: string; duration: number } | null> {
    const res = await fetch(`${this.baseUrl}/recordings?room_name=${encodeURIComponent(roomName)}&limit=20`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Daily.co recordings lookup failed (${res.status})`);
    const body = await res.json() as { data?: { id: string; status: string; duration?: number }[] };
    const done = (body.data ?? []).filter((r) => r.status === 'finished').sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
    return done[0] ? { id: done[0].id, duration: done[0].duration ?? 0 } : null;
  }

  /** A temporary address the browser can play the recording from. */
  async recordingLink(recordingId: string): Promise<{ url: string; expiresAt: Date }> {
    const res = await fetch(`${this.baseUrl}/recordings/${recordingId}/access-link?valid_for_secs=7200`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Daily.co recording link failed (${res.status})`);
    const body = await res.json() as { download_link: string; expires: number };
    return { url: body.download_link, expiresAt: new Date(body.expires * 1000) };
  }

  async createMeetingToken(roomName: string, isOwner: boolean, userName: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/meeting-tokens`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: isOwner,
          user_name: userName,
          enable_recording_ui: isOwner,
          start_cloud_recording: false,
        },
      }),
    });

    if (!res.ok) throw new Error('Failed to create meeting token');
    const data = await res.json() as { token: string };
    return data.token;
  }
}

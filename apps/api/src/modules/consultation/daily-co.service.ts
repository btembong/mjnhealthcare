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

  async deleteRoom(roomName: string): Promise<void> {
    await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
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

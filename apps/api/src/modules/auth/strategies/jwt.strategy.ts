import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '@mjn/database';
import { JwtPayload } from '../auth.service';

// How long a person's "signed out everywhere" moment is remembered before it is looked up again.
const CUTOFF_CACHE_MS = 30_000;
const cutoffs = new Map<string, { at: number; value: number | null }>();

/** Called when someone signs out everywhere, so this server applies it at once. */
export function forgetSessionCutoff(personId: string) {
  cutoffs.delete(personId);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Optional() private readonly db?: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  /** The moment before which this person's logins stopped being valid, if they ever signed out everywhere. */
  private async cutoff(personId: string): Promise<number | null> {
    if (!this.db) return null;
    const cached = cutoffs.get(personId);
    if (cached && Date.now() - cached.at < CUTOFF_CACHE_MS) return cached.value;
    let value: number | null = null;
    try {
      const person = await this.db.person.findUnique({ where: { id: personId }, select: { sessionsValidAfter: true } });
      value = person?.sessionsValidAfter ? person.sessionsValidAfter.getTime() : null;
    } catch {
      // If the lookup fails, do not lock everyone out.
      return null;
    }
    if (cutoffs.size > 5000) cutoffs.clear();
    cutoffs.set(personId, { at: Date.now(), value });
    return value;
  }

  async validate(payload: JwtPayload & { iat?: number }) {
    const cut = await this.cutoff(payload.sub);
    if (cut !== null && payload.iat !== undefined && payload.iat * 1000 < cut) {
      throw new UnauthorizedException('You have been signed out. Please sign in again.');
    }
    return { id: payload.sub, email: payload.email, phone: payload.phone, role: payload.role };
  }
}

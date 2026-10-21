import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mjnhealthcare.com';

type Webinar = {
  title: string; language: 'en' | 'fr'; topic: string | null; startAt: string; durationMinutes: number; status: string;
  speakers?: { name: string; photo: string | null }[]; hosts: string[];
};

/** A Google Font as TTF, which is what the image renderer needs. */
async function font(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    // Asked without a browser's identity, Google serves TrueType, which is what the renderer reads.
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    // Only TrueType or OpenType can be drawn; anything else falls back to a plain font.
    const sig = new Uint8Array(data.slice(0, 4));
    const ok = (sig[0] === 0 && sig[1] === 1 && sig[2] === 0 && sig[3] === 0) || String.fromCharCode(...sig) === 'OTTO' || String.fromCharCode(...sig) === 'true';
    return ok ? data : null;
  } catch {
    return null;
  }
}

/** A remote picture as a data address, or null if it is slow or missing (the cover must never fail). */
async function picture(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/^image\/(jpeg|png|webp)/.test(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > 1.5 * 1024 * 1024) return null;
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${type};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let w: Webinar | null = null;
  try {
    const res = await fetch(`${API}/webinars/public/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (res.ok) w = await res.json();
  } catch { /* draw the generic cover */ }

  const fr = w?.language === 'fr';
  const replay = w?.status === 'ENDED';
  const title = w?.title ?? (fr ? 'Webinaires gratuits MJN Healthcare' : 'Free webinars from MJN Healthcare');
  const size = title.length <= 38 ? 70 : title.length <= 64 ? 60 : title.length <= 90 ? 50 : 44;
  const when = w
    ? new Date(w.startAt).toLocaleString(fr ? 'fr-FR' : 'en-GB', { timeZone: 'Africa/Douala', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    : null;
  const speakers = (w?.speakers ?? w?.hosts.map((name) => ({ name, photo: null })) ?? []).slice(0, 3);

  const [bold, extra, logo, ...faces] = await Promise.all([
    font('Exo 2', 700), font('Exo 2', 800), picture(`${SITE}/mjnlogo.png`), ...speakers.map((s) => picture(s.photo)),
  ]);
  const fonts = [
    bold && { name: 'Exo2', data: bold, weight: 700 as const, style: 'normal' as const },
    extra && { name: 'Exo2', data: extra, weight: 800 as const, style: 'normal' as const },
  ].filter((f): f is NonNullable<typeof f> => !!f);
  const family = fonts.length ? 'Exo2' : 'sans-serif';

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', fontFamily: family, color: '#fff', backgroundImage: 'linear-gradient(135deg, #0A2540 0%, #0F4C81 58%, #0E7C8C 100%)' }}>
        {/* Soft light and texture */}
        <div style={{ position: 'absolute', top: -260, right: -180, width: 720, height: 720, borderRadius: 720, backgroundImage: 'radial-gradient(circle, rgba(0,168,150,0.45) 0%, rgba(0,168,150,0) 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -320, left: -200, width: 760, height: 760, borderRadius: 760, backgroundImage: 'radial-gradient(circle, rgba(21,101,192,0.55) 0%, rgba(21,101,192,0) 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px', display: 'flex' }} />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', padding: '56px 72px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {logo ? <img src={logo} width={46} height={46} style={{ objectFit: 'contain' }} /> : <div style={{ display: 'flex', fontWeight: 800, color: '#0F4C81', fontSize: 20 }}>MJN</div>}
              </div>
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 800 }}>MJN<span style={{ color: '#5EEAD4', marginLeft: 8 }}>Healthcare</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: replay ? '#fff' : 'rgba(255,255,255,0.14)', color: replay ? '#0F4C81' : '#fff', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '10px 22px', fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>
              {replay && <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '14px solid #0F4C81', display: 'flex' }} />}
              {replay ? 'REPLAY' : `${fr ? 'WEBINAIRE GRATUIT' : 'FREE WEBINAR'}  ·  ${fr ? 'FR' : 'EN'}`}
            </div>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto' }}>
            {w?.topic && <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: '#5EEAD4', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>{w.topic}</div>}
            <div style={{ display: 'flex', fontSize: size, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1000 }}>{title}</div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {speakers.length > 0 && (
                <div style={{ display: 'flex' }}>
                  {speakers.map((s, i) => (
                    <div key={i} style={{ width: 72, height: 72, borderRadius: 72, border: '4px solid #fff', marginLeft: i ? -18 : 0, background: i % 2 ? '#00A896' : '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 24, fontWeight: 800 }}>
                      {faces[i] ? <img src={faces[i] as string} width={72} height={72} style={{ objectFit: 'cover' }} /> : initials(s.name)}
                    </div>
                  ))}
                </div>
              )}
              {speakers.length > 0 && <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.9)', maxWidth: 520 }}>{speakers.map((s) => s.name).join(' · ')}</div>}
            </div>
            {when && !replay && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', color: '#0A2540', borderRadius: 18, padding: '14px 22px', fontSize: 24, fontWeight: 800 }}>
                <span style={{ textTransform: 'capitalize' }}>{when}</span>
                <span style={{ color: '#64748B', fontWeight: 700, fontSize: 20 }}>{fr ? 'heure de Douala' : 'Douala time'}</span>
              </div>
            )}
            {replay && <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{fr ? 'Regardez gratuitement' : 'Watch free, any time'}</div>}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 630,
      // Without our font the renderer's own is used, so the cover is always drawn.
      ...(fonts.length ? { fonts } : {}),
      headers: { 'Cache-Control': 'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400' },
    },
  );
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MJN Healthcare Academy and Professional Services';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Load a Google Font as an ArrayBuffer for use with Satori/ImageResponse.
 * Uses the legacy CSS v1 API with an old User-Agent to get TTF URLs
 * instead of woff2 (TTF is what Satori requires).
 */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}`;
    const css = await fetch(cssUrl, {
      headers: {
        // Old UA forces Google to return TTF format instead of woff2
        'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)',
      },
    }).then((r) => r.text());

    const fontUrl = css.match(/src:\s*local\([^)]+\),\s*url\(([^)]+)\)/)?.[1]
      ?? css.match(/url\(([^)]+)\)/)?.[1];

    if (!fontUrl) return null;
    return fetch(fontUrl).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const logoUrl = 'https://mjnhealthcare.com/mjnlogo.png';

  // Load both weights in parallel — fall back to system font if unavailable
  const [fontBold, fontExtrabold] = await Promise.all([
    loadGoogleFont('Exo 2', 700),
    loadGoogleFont('Exo 2', 800),
  ]);

  const fontConfig = [
    fontBold     && { name: 'Exo2', data: fontBold,      weight: 700 as const, style: 'normal' as const },
    fontExtrabold && { name: 'Exo2', data: fontExtrabold, weight: 800 as const, style: 'normal' as const },
  ].filter((f): f is NonNullable<typeof f> => !!f);

  const headlineFont = fontConfig.length > 0 ? 'Exo2, system-ui, sans-serif' : 'system-ui, sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0A2540',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Decorative depth circles ────────────────────────────── */}
        <div style={{
          position: 'absolute', top: -180, right: -80,
          width: 560, height: 560, borderRadius: '50%',
          background: 'rgba(0, 168, 150, 0.09)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -220, right: 60,
          width: 440, height: 440, borderRadius: '50%',
          background: 'rgba(15, 76, 129, 0.25)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: 180, right: 120,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(0, 168, 150, 0.05)',
          display: 'flex',
        }} />

        {/* ── Large watermark "M" top-right ───────────────────────── */}
        <div style={{
          position: 'absolute', top: -40, right: -30,
          fontSize: 480, fontWeight: 900,
          color: 'rgba(255,255,255,0.02)',
          fontFamily: headlineFont,
          lineHeight: 1,
          display: 'flex',
          userSelect: 'none',
        }}>
          M
        </div>

        {/* ── Left teal accent bar ─────────────────────────────────── */}
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: 8, height: 630,
          background: 'linear-gradient(180deg, #00A896 0%, #0F4C81 100%)',
          display: 'flex',
        }} />

        {/* ── Main content ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 80px 52px 92px',
          flex: 1,
        }}>

          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 60 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="MJN"
              width={52}
              height={52}
              style={{ objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontFamily: headlineFont,
                fontSize: 22,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.4px',
              }}>
                MJN Healthcare
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#00A896',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}>
                Academy &amp; Professional Services
              </span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{
              fontFamily: headlineFont,
              fontSize: 70,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.0,
              letterSpacing: '-2px',
              maxWidth: 800,
              display: 'flex',
              flexWrap: 'wrap',
            }}>
              Your Healthcare Career,
            </div>

            {/* "Globally." in brand teal */}
            <div style={{
              fontFamily: headlineFont,
              fontSize: 70,
              fontWeight: 800,
              color: '#00A896',
              lineHeight: 1.05,
              letterSpacing: '-2px',
              display: 'flex',
              marginTop: 4,
            }}>
              Globally.
            </div>

            {/* Sub-description */}
            <div style={{
              marginTop: 28,
              fontSize: 20,
              color: 'rgba(255,255,255,0.60)',
              fontWeight: 400,
              lineHeight: 1.55,
              maxWidth: 680,
              display: 'flex',
            }}>
              Licensing support · Global placement · Exam prep (NCLEX, DHA, NMC) · Student services — for African health professionals.
            </div>
          </div>

          {/* Bottom row: destination pills + URL */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 44,
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {['UAE · DHA/MOH', 'UK · NMC', 'US · NCLEX', 'Ireland · NMBI'].map((label) => (
                <div
                  key={label}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.80)',
                    display: 'flex',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#00A896',
              letterSpacing: '0.3px',
              display: 'flex',
            }}>
              mjnhealthcare.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontConfig.length > 0 ? fontConfig : undefined,
    },
  );
}

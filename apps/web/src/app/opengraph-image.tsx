import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MJN Healthcare Academy and Professional Services';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  const logoUrl = 'https://mjnhealthcare.com/mjnlogo.png';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0F4C81 0%, #0a3560 60%, #062548 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -120, right: -80,
          width: 480, height: 480,
          borderRadius: '50%',
          background: 'rgba(0,168,150,0.12)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: -60,
          width: 360, height: 360,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: 180, right: 80,
          width: 220, height: 220,
          borderRadius: '50%',
          background: 'rgba(0,168,150,0.08)',
          display: 'flex',
        }} />

        {/* Teal accent bar top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #00A896, #0F4C81)',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '64px 80px',
          flex: 1,
        }}>

          {/* Logo + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="MJN" width={64} height={64} style={{ objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                MJN Healthcare
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#00A896', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Academy &amp; Professional Services
              </span>
            </div>
          </div>

          {/* Main headline */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{
              fontSize: 62,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              maxWidth: 800,
              display: 'flex',
              flexWrap: 'wrap',
            }}>
              Your Healthcare Career,{' '}
              <span style={{ color: '#00A896' }}>Globally.</span>
            </div>
            <div style={{
              marginTop: 24,
              fontSize: 22,
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: 680,
              display: 'flex',
            }}>
              Licensing support · Global placement · Exam prep · Student services — for African healthcare professionals.
            </div>
          </div>

          {/* Bottom pills */}
          <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
            {['UAE · DHA / MOH', 'UK · NMC', 'US · NCLEX', 'Ireland · NMBI'].map((label) => (
              <div key={label} style={{
                padding: '8px 18px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                display: 'flex',
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom teal bar */}
        <div style={{
          height: 5,
          background: 'linear-gradient(90deg, #00A896 0%, transparent 100%)',
          display: 'flex',
        }} />
      </div>
    ),
    { ...size }
  );
}

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
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Decorative circles — subtle */}
        <div style={{
          position: 'absolute', top: -100, right: -80,
          width: 420, height: 420,
          borderRadius: '50%',
          background: 'rgba(0,168,150,0.07)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -60,
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'rgba(15,76,129,0.05)',
          display: 'flex',
        }} />

        {/* Top accent bar */}
        <div style={{
          height: 6,
          background: 'linear-gradient(90deg, #0F4C81, #00A896)',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 80px',
          flex: 1,
        }}>

          {/* Logo + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 52 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="MJN" width={60} height={60} style={{ objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#0F4C81', letterSpacing: '-0.5px' }}>
                MJN Healthcare
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#00A896', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Academy &amp; Professional Services
              </span>
            </div>
          </div>

          {/* Main headline */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{
              fontSize: 60,
              fontWeight: 900,
              color: '#0F4C81',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              maxWidth: 820,
              display: 'flex',
              flexWrap: 'wrap',
            }}>
              Your Healthcare Career,{' '}
              <span style={{ color: '#00A896' }}>Globally.</span>
            </div>
            <div style={{
              marginTop: 22,
              fontSize: 21,
              color: '#6B7280',
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: 700,
              display: 'flex',
            }}>
              Licensing support · Global placement · Exam prep · Student services — for African healthcare professionals.
            </div>
          </div>

          {/* Bottom pills */}
          <div style={{ display: 'flex', gap: 10, marginTop: 40 }}>
            {['UAE · DHA / MOH', 'UK · NMC', 'US · NCLEX', 'Ireland · NMBI'].map((label) => (
              <div key={label} style={{
                padding: '8px 18px',
                borderRadius: 999,
                background: '#F0F7FF',
                border: '1px solid #BDD0E8',
                fontSize: 14,
                fontWeight: 600,
                color: '#0F4C81',
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
          background: 'linear-gradient(90deg, #00A896 0%, #0F4C81 100%)',
          display: 'flex',
        }} />
      </div>
    ),
    { ...size }
  );
}

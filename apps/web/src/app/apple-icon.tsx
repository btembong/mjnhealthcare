import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple touch icon — 180×180 for iOS home screen.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            display: 'flex',
          }}
        />
        {/* M lettermark */}
        <span
          style={{
            fontSize: 100,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-5px',
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
    ),
    { width: 180, height: 180 },
  );
}

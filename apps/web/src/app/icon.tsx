import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 96, height: 96 };
export const contentType = 'image/png';

// Browser favicon — 96×96 meets Google's 48px minimum requirement.
// OS/browser applies its own corner masking so no border-radius needed.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 96,
          height: 96,
          background: 'linear-gradient(135deg, #0F4C81 0%, #00A896 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle inner glow */}
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: -12,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
          }}
        />
        {/* M lettermark */}
        <span
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-3px',
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
    ),
    { width: 96, height: 96 },
  );
}

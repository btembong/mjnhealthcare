import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 96, height: 96 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 96,
          height: 96,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mjnhealthcare.com/mjnlogo.png"
          width={90}
          height={90}
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { width: 96, height: 96 },
  );
}

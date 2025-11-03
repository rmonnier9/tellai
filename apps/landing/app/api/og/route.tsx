import { ImageResponse } from 'next/og';
// App router includes @vercel/og.
// No need to install it.

async function loadGoogleFont(font: string, text?: string) {
  const url = text
    ? `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`
    : `https://fonts.googleapis.com/css2?family=${font}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status == 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error('failed to load font data');
}

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5',
          position: 'relative',
        }}
      >
        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '80px 60px',
            height: '480px',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}
          >
            {/* Meet Fern - Caveat font with italic style */}
            <div
              style={{
                fontFamily: 'Caveat',
                fontSize: '68px',
                color: '#ec4899',
                fontWeight: 400,
                fontStyle: 'italic',
                marginBottom: '-20px',
              }}
            >
              Meet Lovarank
            </div>
            {/* <img
              src="https://app.lovarank.com/images/lovarank-logo-icon-2.png"
              alt=""
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                // transform: 'rotate(10px)',
              }}
            /> */}

            {/* Main heading - Bricolage Grotesque */}
            <div
              style={{
                fontFamily: 'Bricolage Grotesque',
                fontSize: '80px',
                color: '#000',
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              The AI agent that grows your organic traffic.
            </div>

            {/* Domain - Geist */}
            <div
              style={{
                fontFamily: 'Geist',
                fontSize: '32px',
                color: '#888',
                letterSpacing: '0.12em',
              }}
            >
              LOVARANK.COM
            </div>
          </div>
        </div>

        {/* Bottom decorative image section */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '150px',
            width: '100%',
            background:
              'linear-gradient(90deg, #ec4899 0%, #db2777 25%, #be185d 50%, #9d174d 75%, #831843 100%)',
            overflow: 'hidden',
          }}
        >
          <img
            src={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://www.lovarank.com'}/images/bg-1.jpeg`}
            width={1200}
            height={630}
            style={{
              // position: 'absolute',
              // bottom: 0,
              // left: 0,
              // right: 0,
              aspectRatio: '16/9',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Geist',
          data: await loadGoogleFont('Geist:wght@600'),
        },
        {
          name: 'Bricolage Grotesque',
          data: await loadGoogleFont('Bricolage+Grotesque:wght@800'),
        },
        {
          name: 'Caveat',
          data: await loadGoogleFont('Caveat:wght@600'),
        },
      ],
    }
  );
}

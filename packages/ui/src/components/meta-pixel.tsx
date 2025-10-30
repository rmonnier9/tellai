'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import React, { useState } from 'react';

import { pageView } from './meta';
import { client } from '@workspace/auth/client';

export default function MetaPixel(props: { pixelId: string }) {
  const session = client.useSession();
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    if (session?.isPending || !loaded || !(window as any).fbq) return;

    pageView({
      email: session?.data?.user?.email!,
      external_id: session?.data?.user?.id!,
    });
  }, [
    pathname,
    loaded,
    session?.data?.user?.email,
    session?.data?.user?.id,
    session?.isPending,
  ]);

  if (!props.pixelId) return null;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      onLoad={() => setLoaded(true)}
    >
      {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${props.pixelId}');
            fbq('track', 'PageView');
          `}
    </Script>
  );
}

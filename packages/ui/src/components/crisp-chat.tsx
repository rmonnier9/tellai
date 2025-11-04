'use client';

import Script from 'next/script';

export default function CrispChat({ websiteId }: { websiteId: string }) {
  if (!websiteId) return null;

  return (
    <Script id="crisp-chat" strategy="afterInteractive">
      {`
        window.$crisp=[];
        window.CRISP_WEBSITE_ID="${websiteId}";
        (function(){
          d=document;
          s=d.createElement("script");
          s.src="https://client.crisp.chat/l.js";
          s.async=1;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `}
    </Script>
  );
}

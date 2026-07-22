import type { Metadata } from "next";
import "../index.css";

async function getSettings() {
  try {
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (baseUrl.endsWith("/api")) {
      baseUrl = baseUrl.slice(0, -4);
    }
    const res = await fetch(`${baseUrl}/api/settings`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch settings for layout metadata:", err);
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  
  const defaultTitle = "Kabayan Shop Saudi | Premium Modest Fashion & Abayas KSA";
  const defaultDescription = "Discover luxury modest fashion, modern abayas, elegant dresses, and terno sets at Kabayan Shop Saudi. Cash on Delivery (COD) across Saudi Arabia with fast home delivery.";
  const defaultKeywords = "kabayan shop saudi, abaya riyadh, modest clothing ksa, buy dress saudi arabia, terno sets online, cod modest fashion";

  if (!settings) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      keywords: defaultKeywords,
    };
  }

  return {
    title: settings.metaTitle || settings.shopName || defaultTitle,
    description: settings.metaDescription || defaultDescription,
    keywords: settings.metaKeywords || defaultKeywords,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const pixelId = settings?.metaPixelId;

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "xqa6t7q435");
            `
          }}
        />
        {pixelId && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');

                  var extId = "";
                  var phone = "";
                  var name = "";
                  try {
                    extId = localStorage.getItem("kabayan_external_id");
                    if (!extId) {
                      extId = "ext-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                      localStorage.setItem("kabayan_external_id", extId);
                    }
                    phone = localStorage.getItem("kabayan_customer_phone") || "";
                    name = localStorage.getItem("kabayan_customer_name") || "";
                  } catch (e) {}

                  var initData = {};
                  if (extId) initData.external_id = extId;
                  if (phone) initData.ph = phone.replace(/\\D/g, "");
                  if (name) initData.fn = name.trim().split(/\\s+/)[0] || "";

                  fbq('init', '${pixelId}', initData);
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}
      </head>
      <body className="antialiased selection:bg-amber-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}

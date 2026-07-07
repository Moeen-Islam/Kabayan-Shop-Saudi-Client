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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-amber-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}

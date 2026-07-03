import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Kabayan Shop Saudi | Premium Modest Fashion & Abayas KSA",
  description: "Discover luxury modest fashion, modern abayas, elegant dresses, and terno sets at Kabayan Shop Saudi. Cash on Delivery (COD) across Saudi Arabia with fast home delivery.",
  keywords: "kabayan shop saudi, abaya riyadh, modest clothing ksa, buy dress saudi arabia, terno sets online, cod modest fashion",
};

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

import type { Metadata } from "next";
import AppClient from "../../../components/AppClient";

async function getProduct(slug: string) {
  try {
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (baseUrl.endsWith("/api")) {
      baseUrl = baseUrl.slice(0, -4);
    }
    const res = await fetch(`${baseUrl}/api/products/slug/${slug}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch product for metadata:", err);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (product) {
    return {
      title: `${product.name} | Kabayan Shop Saudi`,
      description: product.description || `Buy ${product.name} at Kabayan Shop Saudi. Cash on Delivery available.`,
      openGraph: {
        title: `${product.name} | Kabayan Shop Saudi`,
        description: product.description || `Buy ${product.name} at Kabayan Shop Saudi. Cash on Delivery available.`,
        images: product.images && product.images.length > 0 ? [{ url: product.images[0] }] : [],
      }
    };
  }
  return {
    title: "Product Details | Kabayan Shop Saudi",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AppClient initialRoute={`/product/${slug}`} initialSlug={slug} />;
}

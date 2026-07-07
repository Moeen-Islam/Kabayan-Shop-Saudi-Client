import type { Metadata } from "next";
import AppClient from "../../../components/AppClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const capitalized = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
  return {
    title: `${capitalized} Collection | Kabayan Shop Saudi`,
    description: `Browse our latest selection of ${capitalized} products at Kabayan Shop Saudi. Cash on Delivery and fast home delivery options available.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <AppClient initialRoute={`/collections/${category}`} initialCategory={category} />;
}

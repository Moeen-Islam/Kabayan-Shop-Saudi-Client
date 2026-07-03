import AppClient from "../../../components/AppClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AppClient initialRoute={`/product/${slug}`} initialSlug={slug} />;
}

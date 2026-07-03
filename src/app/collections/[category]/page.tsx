import AppClient from "../../../components/AppClient";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <AppClient initialRoute={`/collections/${category}`} initialCategory={category} />;
}

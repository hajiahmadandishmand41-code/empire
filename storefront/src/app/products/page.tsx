import { ProductsClient } from "./products-client";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <ProductsClient initialSearch={q || ""} />;
}

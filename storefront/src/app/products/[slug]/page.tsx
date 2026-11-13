import { getProduct, type Product } from "@/lib/api";
import { ProductDetail } from "./ProductDetail";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: Product | null = null;
  let error: string | null = null;
  try { product = await getProduct(slug); }
  catch (err) { error = (err as Error).message; }
  return <ProductDetail product={product} apiError={error} />;
}

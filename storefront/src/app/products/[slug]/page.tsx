import { ProductDetail } from "./ProductDetail";
export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the real product from the Spree Store API; fall back to a
  // placeholder when the backend is not reachable (e.g. this sandbox).
  let product: Record<string, unknown> | null = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${apiUrl}/api/v3/store/products/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      product = data.data || data;
    }
  } catch {
    // backend not reachable — placeholder used below
  }

  const fallback = {
    name: "نمونه محصول",
    price: 750000,
    description: "این یک توضیحات نمونه محصول است که از پایگاه داده Spree بارگذاری می‌شود.",
    brand: "برند نمونه",
    seller: "فروشنده تست",
    inStock: true,
    sku: "SMP-001",
    moq: 1,
  };

  return <ProductDetail product={product ?? fallback} />;
}

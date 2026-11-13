import { ProductDetail } from "./ProductDetail";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the real product from the Spree Store API. No fake-data fallback:
  // if the backend is unreachable, ProductDetail renders a clear error.
  let product: Record<string, unknown> | null = null;
  let apiError: string | null = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${apiUrl}/api/v3/store/products/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      product = data.data || data;
    } else {
      apiError = `محصول یافت نشد (کد ${res.status})`;
    }
  } catch {
    apiError = "اتصال به سرور فروشگاه برقرار نشد. لطفاً بعداً دوباره سعی کنید.";
  }

  return <ProductDetail product={product} apiError={apiError} />;
}

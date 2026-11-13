import { RfqClient } from "./rfq-client";

export default async function RfqPage({ searchParams }: { searchParams: Promise<{ variant?: string }> }) {
  const { variant } = await searchParams;
  return <RfqClient variantId={variant || ""} />;
}

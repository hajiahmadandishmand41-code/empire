import { listRootCategories } from "@/lib/api";
import type { Category } from "@/lib/api";
import { HeaderClient } from "@/components/layout/header-client";

/** Server half of the header.
 *
 * Categories are fetched here, not in the browser: the navigation is part of
 * the first HTML response, so it is indexable and visible before any script
 * runs. Reference data is cached for 5 minutes (see lib/api.ts), and a backend
 * outage degrades to a header with no category links instead of a blank page.
 */
export async function Header() {
  let categories: Category[] = [];
  try {
    categories = await listRootCategories(8);
  } catch {
    categories = [];
  }
  return <HeaderClient categories={categories} />;
}

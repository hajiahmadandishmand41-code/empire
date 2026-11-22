/** Minimal class combiner. No dependency: the storefront ships to low-bandwidth
 * connections, so every kilobyte of runtime has to earn its place.
 */
export type ClassValue = string | number | null | false | undefined | ClassValue[];

export function cx(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cx(...value);
      if (nested) out.push(nested);
      continue;
    }
    out.push(String(value));
  }
  return out.join(" ");
}

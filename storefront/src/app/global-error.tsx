"use client";

import { useEffect } from "react";

/** Last-resort boundary: the root layout itself failed, so there is no header,
 * footer, provider or stylesheet to lean on. This must stand alone. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html lang="fa-AF" dir="rtl">
      <body style={{ margin: 0, fontFamily: "Vazirmatn, Tahoma, system-ui, sans-serif", background: "#f9fafb", color: "#0a1a33" }}>
        <main style={{ maxWidth: "32rem", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800 }}>مشکلی پیش آمد</h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
            نمایش این صفحه ممکن نشد. سبد خرید و حساب شما دست‌نخورده مانده است.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: "1.5rem", background: "#066847", color: "#fff", border: 0, borderRadius: 8, padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer" }}
          >
            تلاش دوباره
          </button>
        </main>
      </body>
    </html>
  );
}

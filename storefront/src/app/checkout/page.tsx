"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
import { listPaymentMethods, getCart, checkoutOrder } from "@/lib/api";
import type { JsonMap } from "@/lib/api";

export default function CheckoutPage() {
  const [locale] = useState<"fa-AF" | "ps-AF" | "en">("fa-AF");
  const t = useTranslation(locale);
  const [step, setStep] = useState<"address" | "payment" | "review">("address");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank" | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const orderTotal = 1650000;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listPaymentMethods();
        if (!cancelled) {
          setPaymentMethods(
            ((data.data as JsonMap[] | undefined) ?? []).map((pm: JsonMap) => ({
              id: String(pm.id ?? pm.code ?? ""),
              name: String(pm.name ?? pm.display_name ?? pm.id ?? ""),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(
            (err as Error)?.message ||
              "اتصال به سرور فروشگاه برقرار نشد. روش‌های پرداخت در دسترس نیست."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextStep = () => {
    if (step === "address") setStep("payment");
    else if (step === "payment") setStep("review");
  };
  const prevStep = () => {
    if (step === "payment") setStep("address");
    else if (step === "review") setStep("payment");
  };

  const localMethods = paymentMethods.filter(
    (pm) =>
      pm.name.toLowerCase().includes("cash") ||
      pm.name.toLowerCase().includes("bank") ||
      pm.name.toLowerCase().includes("transfer")
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <Link href="/cart" className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-1">
        ← {t("back")}
      </Link>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          {t("loading")}
        </div>
      ) : (
        <>
          {apiError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-amber-800">
                    خطای اتصال به سرور فروشگاه
                  </div>
                  <div className="text-sm text-amber-700 mt-1">{apiError}</div>
                </div>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-brand">{t("checkout_title")}</h1>

          <div className="flex gap-1 mb-8">
            {["address", "payment", "review"].map((s) => (
              <div
                key={s}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  step === s
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gray-100 text-gray-500"
                }`}
                dir="ltr"
              >
                <span className={step === s ? "text-emerald-600" : "text-gray-400"}>
                  {step === "address" && s === "address" ? "1" : step === "payment" && s === "payment" ? "2" : step === "review" ? "3" : "-"}
                </span>
                {s === "address" ? t("shipping_address") : s === "payment" ? t("payment_method") : t("order_summary")}
              </div>
            ))}
          </div>

          {step === "address" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("first_name")}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("last_name")}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("phone_label")}
                  </label>
                  <input
                    type="tel"
                    placeholder="+93 70 123 4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("province")}
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none">
                    <option>کابل</option>
                    <option>هرات</option>
                    <option>بالخ</option>
                    <option>ننگرهار</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("district")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("address_line")}
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  ></textarea>
                </div>
                <div className="flex items-start gap-3">
                  <input id="billing-same" type="checkbox" className="mt-1" />
                  <label htmlFor="billing-same" className="text-sm text-gray-700">
                    آدرس pictureی برابر با آدرس ارسال است
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-slate-brand text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
                  >
                    {t("continue")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "payment" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-brand mb-6">
                {t("payment_method")}
              </h3>
              <div className="space-y-4">
                {localMethods.length > 0 ? (
                  localMethods.map((pm) => (
                    <label
                      key={pm.id}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 transition group"
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        defaultChecked={pm.id === "cod" || paymentMethod === null}
                        onChange={() => setPaymentMethod(pm.id as "cod" | "bank")}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{pm.name}</div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                    هیچ روش پرداخت در دسترس نیست.
                  </div>
                )}
                <div className="border border-amber-100 bg-amber-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-amber-800">
                        فعال‌سازی درگاه پرداخت
                      </div>
                      <div className="text-xs text-amber-700 mt-1">
                        Stripe یا درگاه‌های محلی پس از بررسی قانونی و فعال‌سازی API در منو تنظیمات نمایش داده می‌شوند.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  disabled={!paymentMethod}
                  onClick={nextStep}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                    paymentMethod ? "bg-slate-brand text-white hover:bg-slate-700" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {t("continue")}
                </button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-brand mb-6">
                {t("order_summary")}
              </h3>
              <div className="space-y-4 text-sm mb-8">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("subtotal")}</span>
                  <span className="ltr font-medium">{formatPrice(1400000 * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("shipping")}</span>
                  <span className="ltr font-medium">{formatPrice(150000 * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("tax")}</span>
                  <span className="ltr font-medium">0 AFN</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                  <span>{t("total")}</span>
                  <span className="ltr text-emerald-600">{formatPrice(orderTotal * 100)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">
                      روش پرداخت:{" "}
                      {paymentMethod === "cod" ? t("cash_on_delivery") : t("bank_transfer")}
                    </div>
                    {paymentMethod === "bank" && (
                      <div className="text-xs text-gray-500 mt-1">
                        لطفاً رسید پرداخت را در تکمیل سفارش بارگذاری کنید.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    (async () => {
                      try {
                        const data = await getCart();
                        const order = data.data || data;
                        await checkoutOrder(String((order as { id?: string }).id));
                      } catch (err) {
                        setApiError(
                          (err as Error)?.message || "ثبت سفارش ناموفق بود."
                        );
                      }
                    })();
                  }}
                  className="px-8 py-3 bg-slate-brand text-white text-lg font-semibold rounded-lg hover:bg-slate-700 transition shadow-md"
                >
                  {t("place_order")}
                </button>
                {apiError && (
                  <div className="mt-3 text-red-600 text-sm">{apiError}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

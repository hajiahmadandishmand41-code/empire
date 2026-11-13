"use client";

import { useLocale } from "@/components/locale-provider";

export function ErrorNotice({ message }: { message: string | null }) {
  const { t } = useLocale();
  if (!message) return null;
  const text = message === "configuration_error" ? t("configuration_error") : message === "backend_error" ? t("backend_error") : message;
  return <div role="alert" data-testid="api-error" className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{text}</div>;
}

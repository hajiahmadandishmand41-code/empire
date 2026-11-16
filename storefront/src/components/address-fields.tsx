"use client";

import { useId } from "react";
import type { Address, Province } from "@/lib/api";
import { useLocale } from "@/components/locale-provider";

export const emptyAddress: Address = { first_name: "", last_name: "", address1: "", address2: "", city: "", postal_code: "", phone: "", country_code: "AF", state_name: "" };
export function AddressFields({ value, onChange, provinces = [] }: { value: Address; onChange: (value: Address) => void; provinces?: Province[] }) {
  const { t } = useLocale();
  const idPrefix = useId();
  const id = (key: string) => `${idPrefix}-${key}`;
  const set = (key: keyof Address, input: string) => onChange({ ...value, [key]: input });
  const field = (key: keyof Address, label: string, required = true, type = "text") => <div className="block text-sm"><label htmlFor={id(key)}>{label}</label><input id={id(key)} type={type} required={required} value={String(value[key] || "")} onChange={(e) => set(key, e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2.5" dir={key === "phone" || key === "postal_code" ? "ltr" : undefined} /></div>;
  const province = provinces.find((item) => item.name === value.state_name);
  const selectClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5";
  return <div className="grid gap-4 sm:grid-cols-2">
    {field("first_name", t("first_name"))}{field("last_name", t("last_name"))}{field("phone", t("phone_label"), true, "tel")}{field("country_code", t("country"))}
    {value.country_code === "AF" && provinces.length > 0 ? <div className="block text-sm"><label htmlFor={id("province")}>{t("province")}</label><select id={id("province")} required value={value.state_name || ""} onChange={(e) => onChange({ ...value, state_name: e.target.value, address2: "" })} className={selectClass}><option value="">{t("province")}</option>{provinces.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div> : field("state_name", t("province"), false)}
    {province ? <div className="block text-sm"><label htmlFor={id("district")}>{t("district")}</label><select id={id("district")} value={value.address2 || ""} onChange={(e) => set("address2", e.target.value)} className={selectClass}><option value="">{t("district")}</option>{province.districts.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div> : field("address2", t("district"), false)}
    {field("city", t("city"))}{field("postal_code", t("postal_code"), false)}<div className="sm:col-span-2">{field("address1", t("address_line"))}</div>
  </div>;
}

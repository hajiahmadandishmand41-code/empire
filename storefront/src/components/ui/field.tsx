import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cx } from "@/lib/cx";

const CONTROL =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-navy-950 transition-colors duration-150 " +
  "placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
const STATES = "border-gray-300 hover:border-navy-300 focus:border-jade-600";
const INVALID = "border-red-400 focus:border-red-600";

export function fieldClasses(size: "sm" | "md" = "md", invalid?: boolean, className?: string) {
  return cx(CONTROL, invalid ? INVALID : STATES, size === "sm" ? "h-9" : "h-11", className);
}

/** Label + control + hint/error, wired with a real id so accessible-name
 * queries (and screen readers) always find the label. */
export function Field({
  label, hint, error, required, htmlFor, children, className,
}: { label: ReactNode; hint?: ReactNode; error?: ReactNode; required?: boolean; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("block", className)}>
      {/* The required marker sits outside <label> on purpose: an asterisk
          inside the label becomes part of the control's accessible name, which
          breaks exact-name lookups for assistive tech and for tests. */}
      <div className="mb-1.5 flex items-baseline gap-1">
        <label htmlFor={htmlFor} className="text-sm font-medium text-navy-900">{label}</label>
        {required ? <span className="text-red-600" aria-hidden="true">*</span> : null}
      </div>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p> : hint ? <p className="mt-1.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ label, hint, error, invalid, size, className, id, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode; error?: ReactNode; invalid?: boolean; size?: "sm" | "md" }) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={inputId}>
      <input id={inputId} aria-invalid={invalid || undefined} className={fieldClasses(size, invalid, className)} {...rest} />
    </Field>
  );
}

export function Select({ label, hint, error, invalid, size, className, id, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; hint?: ReactNode; error?: ReactNode; invalid?: boolean; size?: "sm" | "md" }) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={selectId}>
      <div className="relative">
        <select id={selectId} aria-invalid={invalid || undefined} className={fieldClasses(size, invalid, cx("appearance-none pe-9", className))} {...rest}>
          {children}
        </select>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 end-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.5 9.5 12 16l6.5-6.5" />
        </svg>
      </div>
    </Field>
  );
}

export function TextArea({ label, hint, error, invalid, className, id, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode; error?: ReactNode; invalid?: boolean }) {
  const generated = useId();
  const areaId = id ?? generated;
  return (
    <Field label={label} hint={hint} error={error} required={rest.required} htmlFor={areaId}>
      <textarea id={areaId} aria-invalid={invalid || undefined} className={cx(CONTROL, invalid ? INVALID : STATES, "py-2.5 leading-6", className)} {...rest} />
    </Field>
  );
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-2.5 text-sm text-navy-900", className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-jade-700 accent-jade-700" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/**
 * NumericInput
 * --------------------------------------------------------------------------
 * Reusable primitive for controlled numeric inputs that need to support a
 * normal "clear and retype" editing flow.
 *
 * Why this exists:
 *   The naive pattern `value={n}` + `onChange={(e) => setN(parseInt(...) || min)}`
 *   silently snaps the field to `min` on every keystroke, which makes it
 *   impossible for the user to clear the input and retype. This component
 *   keeps the in-progress raw string in local state and only emits a
 *   normalized number to the parent on `blur`.
 *
 * Contract:
 *   - `value` is the upstream normalized number (e.g. from form state).
 *   - During typing the local string buffer is allowed to be empty,
 *     non-numeric, or out-of-range.
 *   - On `blur` we parse + clamp + emit a valid integer in [min, max].
 *   - When the upstream `value` changes (e.g. form reset, edit-existing),
 *     the buffer is re-synced.
 *
 * The normalizePositiveInt helper is exported so callers that need a final
 * coercion at submit time can reuse the same logic.
 */

import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export interface NormalizeOpts {
  /** Lower bound. Defaults to 1. */
  min?: number;
  /** Upper bound. Defaults to Number.MAX_SAFE_INTEGER (effectively unbounded). */
  max?: number;
  /**
   * Value used when the input is empty / NaN / below `min`.
   * Defaults to `min`.
   */
  fallback?: number;
}

/**
 * Parse a raw string input into a clamped positive integer.
 *
 * Pure function — safe to call from any component or at submit time.
 */
export function normalizePositiveInt(v: string, opts: NormalizeOpts = {}): number {
  const min = opts.min ?? 1;
  const max = opts.max ?? Number.MAX_SAFE_INTEGER;
  const fallback = opts.fallback ?? min;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return fallback;
  if (n > max) return max;
  return n;
}

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur" | "type" | "min" | "max" | "step"
>;

export interface NumericInputProps extends NativeInputProps {
  /** Stable id for label association. Auto-generated if omitted. */
  id?: string;
  /** Optional rendered label — uses real <label htmlFor=>. */
  label?: string;
  /** Class names applied to the wrapping field group when `label` is set. */
  groupClassName?: string;
  /** Class names applied to the rendered <label>. */
  labelClassName?: string;
  /** Upstream normalized value. */
  value: number;
  /** Called on blur (and explicit commits) with the normalized integer. */
  onChange: (n: number) => void;
  /** Optional clamp + fallback. */
  min?: number;
  max?: number;
  step?: number;
  fallback?: number;
}

/**
 * NumericInput
 *
 * Use as a drop-in for a number `<input>` whenever the user must be able to
 * clear and retype freely.
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    {
      id,
      label,
      groupClassName,
      labelClassName,
      value,
      onChange,
      min = 1,
      max,
      step = 1,
      fallback,
      className,
      ...rest
    },
    ref,
  ) {
    const reactId = useId();
    const inputId = id ?? `numeric-input-${reactId}`;
    const [draft, setDraft] = useState<string>(String(value));

    // Re-sync when the upstream value changes (form reset, edit existing).
    useEffect(() => {
      setDraft(String(value));
    }, [value]);

    const commit = () => {
      const n = normalizePositiveInt(draft, { min, max, fallback });
      setDraft(String(n));
      if (n !== value) onChange(n);
    };

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className={cn(
          "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm",
          "transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );

    if (!label) return inputEl;
    return (
      <div className={cn("space-y-1", groupClassName)}>
        <label
          htmlFor={inputId}
          className={cn(
            "text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </label>
        {inputEl}
      </div>
    );
  },
);

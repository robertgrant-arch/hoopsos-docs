/**
 * haptics.ts — Safe Capacitor haptic feedback wrapper.
 *
 * - On iOS/Android native builds: fires Capacitor Haptics via lazy import.
 * - On web/PWA: silently no-ops (no bundle cost at idle).
 * - Never throws — all errors are swallowed so haptics never breaks UI flows.
 *
 * Usage:
 *   import { hapticLight, hapticMedium, hapticSelection } from "@/lib/haptics";
 *   onClick={() => { hapticLight(); doSomething(); }}
 */

let _isNative: boolean | null = null;

async function isNativePlatform(): Promise<boolean> {
  if (_isNative !== null) return _isNative;
  try {
    const { Capacitor } = await import("@capacitor/core");
    _isNative = Capacitor.isNativePlatform();
  } catch {
    _isNative = false;
  }
  return _isNative;
}

async function runHaptic(style: "LIGHT" | "MEDIUM" | "HEAVY") {
  if (!(await isNativePlatform())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const styleMap = {
      LIGHT:  ImpactStyle.Light,
      MEDIUM: ImpactStyle.Medium,
      HEAVY:  ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch {
    /* Ignore — haptics are enhancement-only */
  }
}

/** Light tap — tab switches, selections */
export function hapticLight() {
  void runHaptic("LIGHT");
}

/** Medium tap — confirmations, destructive preview */
export function hapticMedium() {
  void runHaptic("MEDIUM");
}

/** Heavy tap — errors, hard limits */
export function hapticHeavy() {
  void runHaptic("HEAVY");
}

/** Selection changed — pickers, toggles */
export async function hapticSelection() {
  if (!(await isNativePlatform())) return;
  try {
    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.selectionChanged();
  } catch {
    /* Ignore */
  }
}

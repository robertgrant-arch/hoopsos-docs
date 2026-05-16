/**
 * Simple slug generator for seasons, teams, and plans.
 * Lowercase, alphanumeric + hyphens only. No external dependency.
 */
export default function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")   // strip non-alphanumeric except spaces/hyphens
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-+|-+$/g, "")         // trim leading/trailing hyphens
    || "untitled";
}

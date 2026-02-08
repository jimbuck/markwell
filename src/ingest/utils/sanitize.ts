/**
 * Sanitize a sheet name for use as a filesystem filename.
 * Replaces invalid characters and trims whitespace.
 */
export function sanitizeSheetName(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "_")
    .trim()
    .replace(/\s+/g, " ")
    || "Sheet";
}

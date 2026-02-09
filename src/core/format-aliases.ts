import type { ExportCategory } from "./types.js";

export interface ResolvedFormat {
  category: ExportCategory;
  extension: string;
}

/**
 * Static alias map: each alias resolves to a fixed category + extension.
 */
const FORMAT_ALIASES: Record<string, ResolvedFormat> = {
  // Presentation
  presentation: { category: "presentation", extension: ".pptx" },
  slides: { category: "presentation", extension: ".pptx" },
  pptx: { category: "presentation", extension: ".pptx" },
  ppt: { category: "presentation", extension: ".pptx" },
  powerpoint: { category: "presentation", extension: ".pptx" },

  // Document
  document: { category: "document", extension: ".docx" },
  docx: { category: "document", extension: ".docx" },
  word: { category: "document", extension: ".docx" },
  doc: { category: "document", extension: ".docx" },

  // Spreadsheet
  spreadsheet: { category: "spreadsheet", extension: ".xlsx" },
  excel: { category: "spreadsheet", extension: ".xlsx" },
  xlsx: { category: "spreadsheet", extension: ".xlsx" },
  xls: { category: "spreadsheet", extension: ".xlsx" },
  sheets: { category: "spreadsheet", extension: ".xlsx" },

  // Transcript
  transcription: { category: "transcript", extension: ".vtt" },
  vtt: { category: "transcript", extension: ".vtt" },
  srt: { category: "transcript", extension: ".srt" },
};

/**
 * Contextual aliases that require input content inspection to resolve.
 */
const CONTEXTUAL_ALIASES = new Set(["html", "pdf"]);

/**
 * Check whether content is Marp presentation markdown.
 * Duplicated from src/ingest/marp.ts to avoid core→ingest dependency.
 */
export function isMarpContent(content: string): boolean {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return false;
  const frontmatter = match[1];
  return /^marp:\s*true$/m.test(frontmatter);
}

export interface ResolveContext {
  inputContent?: string;
}

/**
 * Resolve a single alias string to a category + extension.
 */
export function resolveAlias(
  alias: string,
  context?: ResolveContext,
): ResolvedFormat {
  const key = alias.trim().toLowerCase();

  // Detect old category:format syntax
  if (key.includes(":")) {
    throw new Error(
      `The 'category:format' syntax is no longer supported. Use '--to ${key.split(":")[1]?.trim() || key}' instead.`,
    );
  }

  // Static aliases
  if (key in FORMAT_ALIASES) {
    return FORMAT_ALIASES[key];
  }

  // Contextual aliases
  if (CONTEXTUAL_ALIASES.has(key)) {
    const isMarp =
      context?.inputContent != null && isMarpContent(context.inputContent);

    if (key === "pdf") {
      return isMarp
        ? { category: "presentation", extension: ".pdf" }
        : { category: "document", extension: ".pdf" };
    }

    if (key === "html") {
      return isMarp
        ? { category: "presentation", extension: ".html" }
        : { category: "document", extension: ".html" };
    }
  }

  const allAliases = [
    ...Object.keys(FORMAT_ALIASES),
    ...CONTEXTUAL_ALIASES,
  ].sort();
  throw new Error(
    `Unknown format "${alias}". Available formats: ${allAliases.join(", ")}`,
  );
}

/**
 * Resolve a --to flag value (possibly comma-separated) into target formats.
 */
export function resolveToFlag(
  value: string,
  context?: ResolveContext,
): ResolvedFormat[] {
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("No format specified in --to flag.");
  }

  return parts.map((part) => resolveAlias(part, context));
}

/**
 * Get all known alias names (for help/display purposes).
 */
export function getAliasesForCategory(category: ExportCategory): string[] {
  const aliases: string[] = [];
  for (const [alias, resolved] of Object.entries(FORMAT_ALIASES)) {
    if (resolved.category === category) {
      aliases.push(alias);
    }
  }
  // Add contextual aliases that can resolve to this category
  if (category === "presentation" || category === "document") {
    aliases.push("html", "pdf");
  }
  return aliases;
}

// ── Theme types ───────────────────────────────────────────────────────

import type {
  ResolvedTheme as _ResolvedTheme,
  RawTheme as _RawTheme,
} from "./theme-schema.js";
export type ResolvedTheme = _ResolvedTheme;
export type RawTheme = _RawTheme;

/**
 * A single output file from an ingest or intermediate operation.
 * Used when one source file produces multiple outputs
 * (e.g., xlsx → multiple CSVs).
 */
export interface OutputFile {
  /** Relative path for the output, e.g. "Sheet1.csv" or "slides.md" */
  relativePath: string;
  /** File content as a string */
  content: string;
}

/**
 * Input provided to an ingest converter's canProcess method.
 * Used for content inspection after extension matching.
 */
export interface CanProcessInput {
  /** Original file path */
  filePath: string;
  /** File extension (normalized, lowercase, with dot) */
  extension: string;
  /** File contents as buffer */
  buffer: Buffer;
  /** First ~1KB of the file as string (for quick text inspection) */
  head: string;
}

/**
 * Input provided to an ingest converter's ingest method.
 */
export interface IngestInput {
  /** Absolute path to the source file */
  filePath: string;
  /** Raw file buffer */
  buffer: Buffer;
  /** Converter-specific options from CLI flags */
  options?: Record<string, unknown>;
}

/**
 * Output returned from an ingest converter.
 */
export interface IngestOutput {
  /** Primary markdown content (single-file result) */
  markdown?: string;
  /** Multi-file result (e.g., xlsx → multiple CSVs) */
  files?: OutputFile[];
  /** Extracted images and other binary assets keyed by relative path */
  assets?: Map<string, Buffer>;
  /** Metadata (title, author, date, sheet names, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * An ingest converter transforms a source file into Markdown and/or CSV.
 */
export interface IngestConverter {
  /** Unique converter identifier, e.g. "docx", "xlsx", "marp" */
  name: string;
  /** File extensions this converter handles, e.g. [".docx", ".doc"] */
  extensions: string[];
  /**
   * Determine whether this converter can process the given file.
   * Called AFTER extension matching to inspect contents and confirm.
   * Converters are checked in registration order (most specific first),
   * and the first to return true wins.
   */
  canProcess(input: CanProcessInput): Promise<boolean>;
  /**
   * Convert the source file to Markdown (and/or CSV).
   */
  ingest(input: IngestInput): Promise<IngestOutput>;
}

// ── Export-related types ─────────────────────────────────────────────

/**
 * Export category — determines what kind of output an export converter produces.
 */
export type ExportCategory =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "transcript";

/**
 * A supported output format within an export converter.
 */
export interface ExportFormat {
  /** File extension with dot, e.g. ".docx", ".pdf", ".html" */
  extension: string;
  /** MIME type */
  mimeType: string;
  /** Human-readable label */
  label: string;
}

/**
 * Input provided to an export converter's export method.
 */
export interface ExportInput {
  /** Input files (e.g., single .md for documents, multiple .csv for spreadsheet sheets) */
  files: OutputFile[];
  /** Which output format was requested (extension string, e.g. ".docx") */
  format: string;
  /** Resolved theme configuration */
  theme: ResolvedTheme;
  /** Assets (images, etc.) referenced in the markdown */
  assets?: Map<string, Buffer>;
  /** Converter-specific options */
  options?: Record<string, unknown>;
}

/**
 * Output returned from an export converter.
 */
export interface ExportOutput {
  /** The generated file buffer */
  buffer: Buffer;
  /** Output MIME type */
  mimeType: string;
  /** File extension (with dot) */
  extension: string;
}

/**
 * An export converter transforms Markdown/CSV into a styled output document.
 */
export interface ExportConverter {
  /** Unique converter identifier, e.g. "document", "spreadsheet" */
  name: string;
  /** What category of output this converter produces */
  category: ExportCategory;
  /** Supported output formats, in order of preference (first = default) */
  formats: ExportFormat[];
  /**
   * Convert Markdown/CSV to the target output format.
   */
  export(input: ExportInput): Promise<ExportOutput>;
}


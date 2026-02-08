/**
 * Fully resolved theme configuration.
 * All variables substituted, inheritance merged.
 */
export interface ResolvedTheme {
  name: string;
  colors: Record<string, string>;
  typography: Record<string, unknown>;
  spacing: Record<string, unknown>;
  document: Record<string, unknown>;
  spreadsheet: Record<string, unknown>;
  presentation: Record<string, unknown>;
  transcript: Record<string, unknown>;
  defaults: Record<string, string>;
}

/**
 * Raw theme as loaded from YAML (before resolving inheritance/variables).
 */
export interface RawTheme {
  name?: string;
  extends?: string;
  colors?: Record<string, string>;
  typography?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  document?: Record<string, unknown>;
  spreadsheet?: Record<string, unknown>;
  presentation?: Record<string, unknown>;
  transcript?: Record<string, unknown>;
  defaults?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Default values for every theme field.
 * An empty theme produces this configuration.
 */
export const DEFAULT_THEME: ResolvedTheme = {
  name: "default",
  colors: {
    primary: "2B579A",
    accent: "4472C4",
    text: "333333",
    background: "FFFFFF",
    muted: "888888",
  },
  typography: {
    fontFamily: "Calibri",
    bodySize: 22, // half-points (11pt)
    headingSizes: {
      1: 48, // 24pt
      2: 40, // 20pt
      3: 32, // 16pt
      4: 28, // 14pt
      5: 24, // 12pt
      6: 22, // 11pt
    },
    codeFont: "Courier New",
  },
  spacing: {
    paragraphAfter: 120,
    headingBefore: 240,
    headingAfter: 120,
  },
  document: {
    margins: {
      top: 1440,
      bottom: 1440,
      left: 1440,
      right: 1440,
    },
  },
  spreadsheet: {
    headerBackground: "4472C4",
    headerTextColor: "FFFFFF",
    headerBold: true,
  },
  presentation: {
    paginate: true,
  },
  transcript: {
    speakerLabels: true,
  },
  defaults: {},
};

/**
 * Known top-level fields in a theme file.
 * Used for validation warnings on typos.
 */
export const KNOWN_FIELDS = [
  "name",
  "extends",
  "colors",
  "typography",
  "spacing",
  "document",
  "spreadsheet",
  "presentation",
  "transcript",
  "defaults",
];

/**
 * Suggestions for common typos.
 */
export const TYPO_SUGGESTIONS: Record<string, string> = {
  colrs: "colors",
  colour: "colors",
  colours: "colors",
  color: "colors",
  typo: "typography",
  typograpy: "typography",
  fonts: "typography",
  font: "typography",
  space: "spacing",
  spacings: "spacing",
  doc: "document",
  documents: "document",
  sheet: "spreadsheet",
  sheets: "spreadsheet",
  excel: "spreadsheet",
  slides: "presentation",
  pptx: "presentation",
  present: "presentation",
  sub: "transcript",
  srt: "transcript",
  vtt: "transcript",
  default: "defaults",
};

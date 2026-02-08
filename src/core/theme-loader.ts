import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  DEFAULT_THEME,
  KNOWN_FIELDS,
  TYPO_SUGGESTIONS,
  type RawTheme,
  type ResolvedTheme,
} from "./theme-schema.js";

// ── Built-in theme directory ──────────────────────────────────────────

function getBuiltinThemesDir(): string {
  // In dev: src/themes/. In dist: dist/themes/ (or relative to this file)
  const devPath = join(import.meta.dirname, "../../src/themes");
  if (existsSync(devPath)) return devPath;
  const distPath = join(import.meta.dirname, "../themes");
  if (existsSync(distPath)) return distPath;
  return devPath; // fallback
}

const BUILTIN_THEME_NAMES = ["default", "professional", "modern", "minimal"];

function loadBuiltinTheme(name: string): RawTheme | null {
  if (!BUILTIN_THEME_NAMES.includes(name)) return null;
  const dir = getBuiltinThemesDir();
  const filePath = join(dir, `${name}.yaml`);
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf-8");
  return parseYaml(content) as RawTheme;
}

// ── YAML loading ──────────────────────────────────────────────────────

function loadThemeFile(filePath: string): RawTheme {
  const content = readFileSync(filePath, "utf-8");
  return (parseYaml(content) as RawTheme) ?? {};
}

// ── Directory-tree resolution ─────────────────────────────────────────

export function findThemeFile(startPath: string): string | null {
  let dir = isAbsolute(startPath)
    ? dirname(startPath)
    : resolve(dirname(startPath));

  const root = dirname(dir);
  const visited = new Set<string>();

  while (!visited.has(dir)) {
    visited.add(dir);
    const candidate = join(dir, ".markwell.yaml");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }

  return null;
}

// ── Deep merge ────────────────────────────────────────────────────────

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ── Inheritance ───────────────────────────────────────────────────────

function resolveInheritance(
  theme: RawTheme,
  chain: Set<string> = new Set(),
): RawTheme {
  if (!theme.extends) return theme;

  const extendsName = theme.extends;

  if (chain.has(extendsName)) {
    throw new Error(
      `Circular theme inheritance detected: ${[...chain, extendsName].join(" → ")}`,
    );
  }
  // Track both the theme name and extends target to catch cycles
  if (theme.name) chain.add(theme.name);
  chain.add(extendsName);

  // Load the base theme
  let base: RawTheme | null = loadBuiltinTheme(extendsName);
  if (!base) {
    // Try as file path
    try {
      base = loadThemeFile(extendsName);
    } catch {
      throw new Error(`Cannot load base theme "${extendsName}"`);
    }
  }

  // Recursively resolve the base
  const resolvedBase = resolveInheritance(base, chain);

  // Merge child on top of resolved base
  const { extends: _, ...childWithoutExtends } = theme;
  return deepMerge(
    resolvedBase as Record<string, unknown>,
    childWithoutExtends as Record<string, unknown>,
  ) as RawTheme;
}

// ── Color variable substitution ───────────────────────────────────────

function substituteVariables(
  obj: unknown,
  colors: Record<string, string>,
): unknown {
  if (typeof obj === "string") {
    // Only replace exact $variable matches (whole string)
    const match = obj.match(/^\$(\w+)$/);
    if (match && colors[match[1]] !== undefined) {
      return colors[match[1]];
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => substituteVariables(item, colors));
  }

  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteVariables(value, colors);
    }
    return result;
  }

  return obj;
}

// ── Schema validation ─────────────────────────────────────────────────

export function validateTheme(raw: RawTheme): string[] {
  const warnings: string[] = [];

  for (const key of Object.keys(raw)) {
    if (!KNOWN_FIELDS.includes(key)) {
      const suggestion = TYPO_SUGGESTIONS[key.toLowerCase()];
      if (suggestion) {
        warnings.push(
          `Warning: Unknown field '${key}' in theme — did you mean '${suggestion}'?`,
        );
      } else {
        warnings.push(`Warning: Unknown field '${key}' in theme.`);
      }
    }
  }

  // Validate color values are strings
  if (raw.colors) {
    for (const [key, value] of Object.entries(raw.colors)) {
      if (typeof value !== "string") {
        warnings.push(
          `Warning: Color '${key}' should be a string, got ${typeof value}.`,
        );
      }
    }
  }

  return warnings;
}

// ── Main resolve function ─────────────────────────────────────────────

export interface ResolveThemeOptions {
  /** --theme CLI flag value (name or file path) */
  themeName?: string;
  /** Input file path for directory-tree resolution */
  inputPath?: string;
  /** Callback for validation warnings */
  onWarning?: (message: string) => void;
}

export function resolveTheme(options: ResolveThemeOptions = {}): ResolvedTheme {
  let raw: RawTheme | null = null;

  // 1. Check --theme CLI flag
  if (options.themeName) {
    // Try as built-in name
    raw = loadBuiltinTheme(options.themeName);
    if (!raw) {
      // Try as file path
      try {
        raw = loadThemeFile(options.themeName);
      } catch {
        options.onWarning?.(
          `Warning: Theme "${options.themeName}" not found, using default.`,
        );
      }
    }
  }

  // 2. Try directory-tree resolution
  if (!raw && options.inputPath) {
    const themeFile = findThemeFile(options.inputPath);
    if (themeFile) {
      try {
        raw = loadThemeFile(themeFile);
      } catch {
        options.onWarning?.(
          `Warning: Could not parse theme file "${themeFile}", using default.`,
        );
      }
    }
  }

  // 3. Fall back to built-in default
  if (!raw) {
    return { ...DEFAULT_THEME };
  }

  // Validate
  const warnings = validateTheme(raw);
  for (const w of warnings) {
    options.onWarning?.(w);
  }

  // Resolve inheritance
  const merged = resolveInheritance(raw);

  // Merge with defaults
  const full = deepMerge(
    DEFAULT_THEME as unknown as Record<string, unknown>,
    merged as Record<string, unknown>,
  ) as unknown as ResolvedTheme;

  // Substitute color variables
  const colors = full.colors ?? {};
  const substituted = substituteVariables(full, colors) as ResolvedTheme;

  return substituted;
}

/**
 * Get a list of built-in theme names.
 */
export function listBuiltinThemes(): string[] {
  return [...BUILTIN_THEME_NAMES];
}

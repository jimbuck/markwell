import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  resolveTheme,
  findThemeFile,
  validateTheme,
  listBuiltinThemes,
} from "./theme-loader.js";
import { DEFAULT_THEME } from "./theme-schema.js";

describe("theme-loader", () => {
  describe("resolveTheme", () => {
    it("returns default theme when no options provided", () => {
      const theme = resolveTheme();
      expect(theme.name).toBe("default");
      expect(theme.colors.primary).toBe("2B579A");
      expect(theme.typography.fontFamily).toBe("Calibri");
    });

    it("loads a built-in theme by name", () => {
      const theme = resolveTheme({ themeName: "professional" });
      expect(theme.name).toBe("professional");
      expect(theme.colors.primary).toBe("1B3A5C");
    });

    it("loads modern built-in theme", () => {
      const theme = resolveTheme({ themeName: "modern" });
      expect(theme.name).toBe("modern");
      expect(theme.colors.primary).toBe("E74C3C");
      expect(theme.typography.fontFamily).toBe("Segoe UI");
    });

    it("loads minimal built-in theme", () => {
      const theme = resolveTheme({ themeName: "minimal" });
      expect(theme.name).toBe("minimal");
      expect(theme.colors.primary).toBe("333333");
    });

    it("falls back to default for unknown theme name", () => {
      const warnings: string[] = [];
      const theme = resolveTheme({
        themeName: "nonexistent",
        onWarning: (w) => warnings.push(w),
      });
      expect(theme.name).toBe("default");
      expect(warnings.length).toBeGreaterThan(0);
    });

    it("loads theme from file path", () => {
      const tmpDir = join(tmpdir(), `markwell-test-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });
      const themeFile = join(tmpDir, "custom.yaml");
      writeFileSync(
        themeFile,
        'name: custom\ncolors:\n  primary: "FF0000"\n',
      );

      try {
        const theme = resolveTheme({ themeName: themeFile });
        expect(theme.name).toBe("custom");
        expect(theme.colors.primary).toBe("FF0000");
        // Should still have defaults for unspecified fields
        expect(theme.typography.fontFamily).toBe("Calibri");
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("findThemeFile", () => {
    it("finds .markwell.yaml in the directory", () => {
      const tmpDir = join(tmpdir(), `markwell-find-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });
      const themeFile = join(tmpDir, ".markwell.yaml");
      writeFileSync(themeFile, "name: test\n");

      try {
        const found = findThemeFile(join(tmpDir, "somefile.md"));
        expect(found).toBe(themeFile);
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("walks up directories to find theme", () => {
      const tmpDir = join(tmpdir(), `markwell-walk-${Date.now()}`);
      const subDir = join(tmpDir, "sub", "nested");
      mkdirSync(subDir, { recursive: true });
      const themeFile = join(tmpDir, ".markwell.yaml");
      writeFileSync(themeFile, "name: parent\n");

      try {
        const found = findThemeFile(join(subDir, "test.md"));
        expect(found).toBe(themeFile);
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("returns null when no theme file found", () => {
      const found = findThemeFile("/tmp/nonexistent/path/test.md");
      expect(found).toBeNull();
    });
  });

  describe("theme inheritance", () => {
    it("resolves single-level inheritance", () => {
      const theme = resolveTheme({ themeName: "professional" });
      // professional extends default, overrides primary
      expect(theme.colors.primary).toBe("1B3A5C");
      // Should still have default's background
      expect(theme.colors.background).toBe("FFFFFF");
    });

    it("detects circular inheritance", () => {
      const tmpDir = join(tmpdir(), `markwell-circ-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const fileA = join(tmpDir, "a.yaml");
      const fileB = join(tmpDir, "b.yaml");
      writeFileSync(fileA, `name: a\nextends: ${fileB}\n`);
      writeFileSync(fileB, `name: b\nextends: ${fileA}\n`);

      try {
        expect(() => resolveTheme({ themeName: fileA })).toThrow(
          /[Cc]ircular/,
        );
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("color variable substitution", () => {
    it("substitutes $primary in theme values", () => {
      const theme = resolveTheme({ themeName: "default" });
      // default.yaml has spreadsheet.headerBackground: "$accent"
      expect(theme.spreadsheet.headerBackground).toBe("4472C4");
    });

    it("substitutes $primary in professional theme", () => {
      const theme = resolveTheme({ themeName: "professional" });
      // professional.yaml has spreadsheet.headerBackground: "$primary"
      expect(theme.spreadsheet.headerBackground).toBe("1B3A5C");
    });
  });

  describe("validateTheme", () => {
    it("warns on unknown fields", () => {
      const warnings = validateTheme({ colrs: { primary: "red" } });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("colrs");
      expect(warnings[0]).toContain("colors");
    });

    it("returns no warnings for valid theme", () => {
      const warnings = validateTheme({
        name: "test",
        colors: { primary: "FF0000" },
      });
      expect(warnings).toHaveLength(0);
    });

    it("warns on invalid color values", () => {
      const warnings = validateTheme({
        colors: { primary: 123 as unknown as string },
      });
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("primary");
    });
  });

  describe("listBuiltinThemes", () => {
    it("returns all built-in theme names", () => {
      const names = listBuiltinThemes();
      expect(names).toContain("default");
      expect(names).toContain("professional");
      expect(names).toContain("modern");
      expect(names).toContain("minimal");
    });
  });

  describe("DEFAULT_THEME", () => {
    it("has all required sections", () => {
      expect(DEFAULT_THEME.name).toBe("default");
      expect(DEFAULT_THEME.colors).toBeDefined();
      expect(DEFAULT_THEME.typography).toBeDefined();
      expect(DEFAULT_THEME.spacing).toBeDefined();
      expect(DEFAULT_THEME.document).toBeDefined();
      expect(DEFAULT_THEME.spreadsheet).toBeDefined();
      expect(DEFAULT_THEME.presentation).toBeDefined();
      expect(DEFAULT_THEME.transcript).toBeDefined();
    });
  });
});

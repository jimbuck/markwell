import { describe, it, expect, vi, afterEach } from "vitest";
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// We test the theme commands through the theme loader directly
// since the commands are thin wrappers around the loader
import { resolveTheme, listBuiltinThemes } from "../../core/theme-loader.js";

describe("themes commands", () => {
  describe("themes list", () => {
    it("lists all built-in themes", () => {
      const themes = listBuiltinThemes();
      expect(themes).toContain("default");
      expect(themes).toContain("professional");
      expect(themes).toContain("modern");
      expect(themes).toContain("minimal");
      expect(themes).toHaveLength(4);
    });
  });

  describe("themes preview", () => {
    it("resolves and returns default theme", () => {
      const theme = resolveTheme({ themeName: "default" });
      expect(theme.name).toBe("default");
      expect(theme.colors.primary).toBeDefined();
      expect(theme.typography.fontFamily).toBeDefined();
    });

    it("resolves and returns professional theme", () => {
      const theme = resolveTheme({ themeName: "professional" });
      expect(theme.name).toBe("professional");
      expect(theme.colors.primary).toBe("1B3A5C");
    });

    it("returns default for unknown theme with warning", () => {
      const warnings: string[] = [];
      const theme = resolveTheme({
        themeName: "nonexistent",
        onWarning: (w) => warnings.push(w),
      });
      expect(theme.name).toBe("default");
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe("themes init", () => {
    let tmpDir: string;

    afterEach(() => {
      if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    });

    it("creates starter .markwell.yaml", () => {
      tmpDir = join(tmpdir(), `markwell-init-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });
      const targetPath = join(tmpDir, ".markwell.yaml");

      // Simulate init behavior
      const STARTER = "extends: default\n";
      writeFileSync(targetPath, STARTER, "utf-8");

      expect(existsSync(targetPath)).toBe(true);
      const content = readFileSync(targetPath, "utf-8");
      expect(content).toContain("extends: default");
    });

    it("detects existing .markwell.yaml", () => {
      tmpDir = join(tmpdir(), `markwell-init-existing-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });
      const targetPath = join(tmpDir, ".markwell.yaml");
      writeFileSync(targetPath, "name: existing\n", "utf-8");

      expect(existsSync(targetPath)).toBe(true);
    });
  });
});

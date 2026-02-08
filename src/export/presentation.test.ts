import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { presentationExport } from "./presentation.js";
import type { ResolvedTheme } from "../core/types.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

const defaultTheme: ResolvedTheme = {
  name: "default",
  colors: { primary: "2B579A", accent: "4472C4" },
  typography: { fontFamily: "Calibri" },
  spacing: {},
  document: {},
  spreadsheet: {},
  presentation: { paginate: true },
  transcript: {},
  defaults: {},
};

describe("presentationExport", () => {
  it("has correct name, category, and formats", () => {
    expect(presentationExport.name).toBe("presentation");
    expect(presentationExport.category).toBe("presentation");
    expect(presentationExport.formats.length).toBeGreaterThanOrEqual(1);
    expect(presentationExport.formats[0].extension).toBe(".html");
  });

  it(
    "renders Markdown to HTML presentation",
    { timeout: 30000 },
    async () => {
      const content = fs.readFileSync(
        path.join(fixturesDir, "sample-marp.md"),
        "utf-8",
      );
      const result = await presentationExport.export({
        files: [{ relativePath: "slides.md", content }],
        format: ".html",
        theme: defaultTheme,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.extension).toBe(".html");
      expect(result.mimeType).toBe("text/html");
    },
  );

  it("HTML output contains slide content", { timeout: 15000 }, async () => {
    const content =
      "# Slide 1\n\nHello world\n\n---\n\n# Slide 2\n\n- Item A\n- Item B\n";
    const result = await presentationExport.export({
      files: [{ relativePath: "slides.md", content }],
      format: ".html",
      theme: defaultTheme,
    });

    const html = result.buffer.toString("utf-8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Slide 1");
    expect(html).toContain("Hello world");
    expect(html).toContain("Slide 2");
    expect(html).toContain("Item A");
  });

  it(
    "applies theme settings to HTML output",
    { timeout: 15000 },
    async () => {
      const content = "# Themed Slide\n\nContent here.\n";
      const themeWithStyle: ResolvedTheme = {
        ...defaultTheme,
        presentation: {
          paginate: true,
          footer: "My Presentation",
        },
      };

      const result = await presentationExport.export({
        files: [{ relativePath: "slides.md", content }],
        format: ".html",
        theme: themeWithStyle,
      });

      const html = result.buffer.toString("utf-8");
      expect(html).toContain("Themed Slide");
    },
  );

  it(
    "merges theme frontmatter with existing content",
    { timeout: 15000 },
    async () => {
      const content =
        "---\ntitle: My Slides\n---\n\n# Slide 1\n\nContent.\n";
      const result = await presentationExport.export({
        files: [{ relativePath: "slides.md", content }],
        format: ".html",
        theme: defaultTheme,
      });

      const html = result.buffer.toString("utf-8");
      expect(html).toContain("Slide 1");
    },
  );

  it("rejects unsupported format", async () => {
    const content = "# Test\n";
    await expect(
      presentationExport.export({
        files: [{ relativePath: "slides.md", content }],
        format: ".ogg",
        theme: defaultTheme,
      }),
    ).rejects.toThrow("Unsupported presentation format");
  });
});

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { marpIngest } from "./marp.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

describe("marpIngest", () => {
  it("has correct name and extensions", () => {
    expect(marpIngest.name).toBe("marp");
    expect(marpIngest.extensions).toContain(".md");
    expect(marpIngest.extensions).toContain(".markdown");
  });

  it("canProcess detects marp: true frontmatter", async () => {
    const content = "---\nmarp: true\ntheme: default\n---\n\n# Hello";
    const result = await marpIngest.canProcess({
      filePath: "slides.md",
      extension: ".md",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(true);
  });

  it("canProcess rejects regular Markdown", async () => {
    const content = "# Just a normal heading\n\nSome text.";
    const result = await marpIngest.canProcess({
      filePath: "readme.md",
      extension: ".md",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(false);
  });

  it("canProcess rejects frontmatter without marp directive", async () => {
    const content = "---\ntitle: My Doc\nauthor: Me\n---\n\n# Hello";
    const result = await marpIngest.canProcess({
      filePath: "doc.md",
      extension: ".md",
      buffer: Buffer.from(content),
      head: content,
    });
    expect(result).toBe(false);
  });

  it("strips MARP-specific frontmatter fields", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample-marp.md"));
    const result = await marpIngest.ingest({
      filePath: path.join(fixturesDir, "sample-marp.md"),
      buffer,
    });

    expect(result.markdown).not.toContain("marp: true");
    expect(result.markdown).not.toContain("paginate: true");
    expect(result.markdown).not.toContain("theme: default");
  });

  it("preserves non-MARP frontmatter fields", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample-marp.md"));
    const result = await marpIngest.ingest({
      filePath: path.join(fixturesDir, "sample-marp.md"),
      buffer,
    });

    expect(result.markdown).toContain("title: Sample Presentation");
  });

  it("preserves slide content", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample-marp.md"));
    const result = await marpIngest.ingest({
      filePath: path.join(fixturesDir, "sample-marp.md"),
      buffer,
    });

    expect(result.markdown).toContain("# Slide 1: Introduction");
    expect(result.markdown).toContain("# Slide 2: Key Points");
    expect(result.markdown).toContain("- Point one");
    expect(result.markdown).toContain("# Slide 3: Conclusion");
  });

  it("sets wasMarp metadata", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample-marp.md"));
    const result = await marpIngest.ingest({
      filePath: path.join(fixturesDir, "sample-marp.md"),
      buffer,
    });

    expect(result.metadata?.wasMarp).toBe(true);
  });
});

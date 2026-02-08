import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { htmlIngest } from "./html.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

describe("htmlIngest", () => {
  it("has correct name and extensions", () => {
    expect(htmlIngest.name).toBe("html");
    expect(htmlIngest.extensions).toContain(".html");
    expect(htmlIngest.extensions).toContain(".htm");
  });

  it("canProcess always returns true for HTML extensions", async () => {
    const result = await htmlIngest.canProcess({
      filePath: "page.html",
      extension: ".html",
      buffer: Buffer.from("<html></html>"),
      head: "<html></html>",
    });
    expect(result).toBe(true);
  });

  it("converts HTML to markdown preserving headings", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.html"));
    const result = await htmlIngest.ingest({
      filePath: path.join(fixturesDir, "sample.html"),
      buffer,
    });

    expect(result.markdown).toContain("# Main Heading");
    expect(result.markdown).toContain("## Sub Heading");
  });

  it("preserves bold and italic", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.html"));
    const result = await htmlIngest.ingest({
      filePath: path.join(fixturesDir, "sample.html"),
      buffer,
    });

    expect(result.markdown).toContain("**bold text**");
    expect(result.markdown).toContain("_italic text_");
  });

  it("preserves lists", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.html"));
    const result = await htmlIngest.ingest({
      filePath: path.join(fixturesDir, "sample.html"),
      buffer,
    });

    expect(result.markdown).toContain("Item one");
    expect(result.markdown).toContain("Item two");
  });

  it("preserves links", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.html"));
    const result = await htmlIngest.ingest({
      filePath: path.join(fixturesDir, "sample.html"),
      buffer,
    });

    expect(result.markdown).toContain("[Example](https://example.com)");
  });
});

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { rtfIngest } from "./rtf.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

describe("rtfIngest", () => {
  it("has correct name and extensions", () => {
    expect(rtfIngest.name).toBe("rtf");
    expect(rtfIngest.extensions).toContain(".rtf");
  });

  it("canProcess detects RTF header", async () => {
    const result = await rtfIngest.canProcess({
      filePath: "doc.rtf",
      extension: ".rtf",
      buffer: Buffer.from("{\\rtf1\\ansi hello}"),
      head: "{\\rtf1\\ansi hello}",
    });
    expect(result).toBe(true);
  });

  it("canProcess rejects non-RTF content", async () => {
    const result = await rtfIngest.canProcess({
      filePath: "doc.rtf",
      extension: ".rtf",
      buffer: Buffer.from("Hello world"),
      head: "Hello world",
    });
    expect(result).toBe(false);
  });

  it("converts RTF to markdown preserving bold", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.rtf"));
    const result = await rtfIngest.ingest({
      filePath: path.join(fixturesDir, "sample.rtf"),
      buffer,
    });

    expect(result.markdown).toContain("**bold text**");
  });

  it("preserves italic text", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.rtf"));
    const result = await rtfIngest.ingest({
      filePath: path.join(fixturesDir, "sample.rtf"),
      buffer,
    });

    expect(result.markdown).toContain("_italic text_");
  });

  it("preserves content text", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.rtf"));
    const result = await rtfIngest.ingest({
      filePath: path.join(fixturesDir, "sample.rtf"),
      buffer,
    });

    expect(result.markdown).toContain("Main Heading");
    expect(result.markdown).toContain("Item one");
    expect(result.markdown).toContain("Item two");
  });
});

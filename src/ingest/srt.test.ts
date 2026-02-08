import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { srtIngest } from "./srt.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

describe("srtIngest", () => {
  it("has correct name and extensions", () => {
    expect(srtIngest.name).toBe("srt");
    expect(srtIngest.extensions).toContain(".srt");
  });

  it("canProcess returns true for valid SRT", async () => {
    const head = "1\n00:00:01,000 --> 00:00:04,500\nHello";
    const result = await srtIngest.canProcess({
      filePath: "test.srt",
      extension: ".srt",
      buffer: Buffer.from(head),
      head,
    });
    expect(result).toBe(true);
  });

  it("canProcess returns false for non-SRT", async () => {
    const result = await srtIngest.canProcess({
      filePath: "test.srt",
      extension: ".srt",
      buffer: Buffer.from("not an srt file"),
      head: "not an srt file",
    });
    expect(result).toBe(false);
  });

  it("parses SRT and produces transcript markdown", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.srt"));
    const result = await srtIngest.ingest({
      filePath: path.join(fixturesDir, "sample.srt"),
      buffer,
    });

    expect(result.markdown).toBeDefined();
    expect(result.markdown).toContain("## Transcript");
    expect(result.markdown).toContain("Hello everyone");
    // SRT timestamp commas should be normalized to periods
    expect(result.markdown).toContain("00:00:01.000 --> 00:00:04.500");
    // Timestamps should not contain commas (SRT format uses commas, we normalize to periods)
    const timestampMatches = result.markdown!.match(/\[\d{2}:\d{2}:\d{2}[.,]\d{3}/g);
    if (timestampMatches) {
      for (const ts of timestampMatches) {
        expect(ts).not.toContain(",");
      }
    }
  });

  it("handles multi-line cues", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.srt"));
    const result = await srtIngest.ingest({
      filePath: path.join(fixturesDir, "sample.srt"),
      buffer,
    });

    expect(result.markdown).toContain("multi-line");
    expect(result.markdown).toContain("subtitle cue");
  });

  it("does not include speaker labels (SRT has none)", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.srt"));
    const result = await srtIngest.ingest({
      filePath: path.join(fixturesDir, "sample.srt"),
      buffer,
    });

    // The timestamp lines should not have speaker names after them
    const lines = result.markdown!.split("\n");
    const timestampLines = lines.filter((l) => l.startsWith("**["));
    for (const tl of timestampLines) {
      // Should end with ]** and nothing else
      expect(tl).toMatch(/\*\*$/);
    }
  });

  it("includes cue count in metadata", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.srt"));
    const result = await srtIngest.ingest({
      filePath: path.join(fixturesDir, "sample.srt"),
      buffer,
    });

    expect(result.metadata!.cueCount).toBe(3);
  });
});

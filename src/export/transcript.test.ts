import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { transcriptExport } from "./transcript.js";
import { vttIngest } from "../ingest/vtt.js";
import { srtIngest } from "../ingest/srt.js";
import type { ResolvedTheme } from "../core/types.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

const defaultTheme: ResolvedTheme = {
  name: "default",
  colors: {},
  typography: {},
  spacing: {},
  document: {},
  spreadsheet: {},
  presentation: {},
  transcript: { speakerLabels: true },
  defaults: {},
};

describe("transcriptExport", () => {
  it("has correct name, category, and formats", () => {
    expect(transcriptExport.name).toBe("transcript");
    expect(transcriptExport.category).toBe("transcript");
    expect(transcriptExport.formats).toHaveLength(2);
    expect(transcriptExport.formats[0].extension).toBe(".vtt");
    expect(transcriptExport.formats[1].extension).toBe(".srt");
  });

  it("exports Markdown to VTT format", async () => {
    const markdown = `## Transcript

**[00:00:01.000 --> 00:00:04.500]** Alice
Hello there, how are you?

**[00:00:05.000 --> 00:00:08.200]**
I'm doing well, thanks.
`;

    const result = await transcriptExport.export({
      files: [{ relativePath: "transcript.md", content: markdown }],
      format: ".vtt",
      theme: defaultTheme,
    });

    const vtt = result.buffer.toString("utf-8");
    expect(vtt).toContain("WEBVTT");
    expect(vtt).toContain("00:00:01.000 --> 00:00:04.500");
    expect(vtt).toContain("<v Alice>Hello there, how are you?</v>");
    expect(vtt).toContain("00:00:05.000 --> 00:00:08.200");
    expect(vtt).toContain("I'm doing well, thanks.");
    expect(result.extension).toBe(".vtt");
  });

  it("exports Markdown to SRT format", async () => {
    const markdown = `## Transcript

**[00:00:01.000 --> 00:00:04.500]** Alice
Hello there.

**[00:00:05.000 --> 00:00:08.200]**
Second line.
`;

    const result = await transcriptExport.export({
      files: [{ relativePath: "transcript.md", content: markdown }],
      format: ".srt",
      theme: defaultTheme,
    });

    const srt = result.buffer.toString("utf-8");
    // SRT uses comma for milliseconds
    expect(srt).toContain("00:00:01,000 --> 00:00:04,500");
    expect(srt).toContain("Hello there.");
    expect(srt).toContain("00:00:05,000 --> 00:00:08,200");
    // SRT does not include speaker labels
    expect(srt).not.toContain("Alice");
    expect(result.extension).toBe(".srt");
  });

  it("handles empty transcript", async () => {
    const markdown = "## Transcript\n\nNo cues here.\n";
    const result = await transcriptExport.export({
      files: [{ relativePath: "empty.md", content: markdown }],
      format: ".vtt",
      theme: defaultTheme,
    });

    const vtt = result.buffer.toString("utf-8");
    expect(vtt).toContain("WEBVTT");
    // Should have just the header
    expect(vtt.trim()).toBe("WEBVTT");
  });

  it("handles single cue", async () => {
    const markdown = `## Transcript

**[00:00:00.000 --> 00:00:02.000]**
Just one cue.
`;

    const result = await transcriptExport.export({
      files: [{ relativePath: "single.md", content: markdown }],
      format: ".srt",
      theme: defaultTheme,
    });

    const srt = result.buffer.toString("utf-8");
    expect(srt).toContain("1\n00:00:00,000 --> 00:00:02,000\nJust one cue.");
  });

  it("round-trips VTT through ingest and export", async () => {
    const vttBuffer = fs.readFileSync(
      path.join(fixturesDir, "sample.vtt"),
    );
    const ingestResult = await vttIngest.ingest({
      filePath: path.join(fixturesDir, "sample.vtt"),
      buffer: vttBuffer,
    });

    const exportResult = await transcriptExport.export({
      files: [
        { relativePath: "roundtrip.md", content: ingestResult.markdown! },
      ],
      format: ".vtt",
      theme: defaultTheme,
    });

    const outputVtt = exportResult.buffer.toString("utf-8");
    expect(outputVtt).toContain("WEBVTT");
    // Original content should be preserved
    expect(outputVtt).toContain("00:00:01.000 --> 00:00:04.500");
  });

  it("round-trips SRT through ingest and export", async () => {
    const srtBuffer = fs.readFileSync(
      path.join(fixturesDir, "sample.srt"),
    );
    const ingestResult = await srtIngest.ingest({
      filePath: path.join(fixturesDir, "sample.srt"),
      buffer: srtBuffer,
    });

    const exportResult = await transcriptExport.export({
      files: [
        { relativePath: "roundtrip.md", content: ingestResult.markdown! },
      ],
      format: ".srt",
      theme: defaultTheme,
    });

    const outputSrt = exportResult.buffer.toString("utf-8");
    expect(outputSrt).toContain("1\n");
    // SRT uses comma for milliseconds
    expect(outputSrt).toContain(",");
    expect(outputSrt).toContain("-->");
  });

  it("rejects unsupported format", async () => {
    await expect(
      transcriptExport.export({
        files: [{ relativePath: "test.md", content: "test" }],
        format: ".txt",
        theme: defaultTheme,
      }),
    ).rejects.toThrow("Unsupported transcript format");
  });
});

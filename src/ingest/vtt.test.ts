import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { vttIngest } from "./vtt.js";

const fixturesDir = path.join(import.meta.dirname, "../../tests/fixtures");

describe("vttIngest", () => {
  it("has correct name and extensions", () => {
    expect(vttIngest.name).toBe("vtt");
    expect(vttIngest.extensions).toContain(".vtt");
  });

  it("canProcess returns true for valid VTT", async () => {
    const result = await vttIngest.canProcess({
      filePath: "test.vtt",
      extension: ".vtt",
      buffer: Buffer.from("WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello"),
      head: "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello",
    });
    expect(result).toBe(true);
  });

  it("canProcess returns false for non-VTT", async () => {
    const result = await vttIngest.canProcess({
      filePath: "test.vtt",
      extension: ".vtt",
      buffer: Buffer.from("not a vtt file"),
      head: "not a vtt file",
    });
    expect(result).toBe(false);
  });

  it("parses VTT with speaker labels", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.vtt"));
    const result = await vttIngest.ingest({
      filePath: path.join(fixturesDir, "sample.vtt"),
      buffer,
    });

    expect(result.markdown).toBeDefined();
    expect(result.markdown).toContain("## Transcript");
    expect(result.markdown).toContain("Alice");
    expect(result.markdown).toContain("Bob");
    expect(result.markdown).toContain("Hello everyone");
    expect(result.markdown).toContain("00:00:01.000 --> 00:00:04.500");
  });

  it("handles cues without speaker labels", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.vtt"));
    const result = await vttIngest.ingest({
      filePath: path.join(fixturesDir, "sample.vtt"),
      buffer,
    });

    expect(result.markdown).toContain(
      "This is a cue without a speaker label",
    );
  });

  it("includes cue count in metadata", async () => {
    const buffer = fs.readFileSync(path.join(fixturesDir, "sample.vtt"));
    const result = await vttIngest.ingest({
      filePath: path.join(fixturesDir, "sample.vtt"),
      buffer,
    });

    expect(result.metadata).toBeDefined();
    expect(result.metadata!.cueCount).toBe(4);
  });
});

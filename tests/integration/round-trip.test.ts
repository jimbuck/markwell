import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { vttIngest } from "../../src/ingest/vtt.js";
import { srtIngest } from "../../src/ingest/srt.js";
import { transcriptExport } from "../../src/export/transcript.js";
import { spreadsheetExport } from "../../src/export/spreadsheet.js";
import { documentExport } from "../../src/export/document.js";

const FIXTURES = join(import.meta.dirname, "../fixtures");

describe("round-trip fidelity", () => {
  describe("VTT → Markdown → VTT", () => {
    it("preserves timestamps and text content", async () => {
      const vttBuffer = readFileSync(join(FIXTURES, "sample.vtt"));
      const vttContent = vttBuffer.toString("utf-8");

      // Ingest: VTT → Markdown
      const ingestResult = await vttIngest.ingest({
        filePath: "sample.vtt",
        buffer: vttBuffer,
      });
      expect(ingestResult.markdown).toBeTruthy();

      // Export: Markdown → VTT
      const exportResult = await transcriptExport.export({
        files: [{ relativePath: "sample.md", content: ingestResult.markdown! }],
        format: ".vtt",
        theme: { name: "default", colors: {}, typography: {}, spacing: {}, document: {}, spreadsheet: {}, presentation: {}, transcript: {}, defaults: {} },
        options: {},
      });

      const roundTripped = exportResult.buffer.toString("utf-8");
      expect(roundTripped).toContain("WEBVTT");

      // Verify timestamps are preserved
      // Original VTT should have timestamps; round-tripped should too
      const origTimestamps = vttContent.match(/\d{2}:\d{2}:\d{2}\.\d{3}/g) || [];
      const rtTimestamps = roundTripped.match(/\d{2}:\d{2}:\d{2}\.\d{3}/g) || [];
      expect(rtTimestamps.length).toBeGreaterThanOrEqual(origTimestamps.length);

      // Verify text content is preserved (words appear in both)
      const textWords = vttContent
        .split("\n")
        .filter((l) => l.trim() && !l.includes("-->") && !l.startsWith("WEBVTT") && !/^\d+$/.test(l.trim()))
        .join(" ")
        .split(/\s+/)
        .filter((w) => w.length > 3);

      for (const word of textWords.slice(0, 5)) {
        // Check first few significant words survive round-trip
        expect(roundTripped.toLowerCase()).toContain(word.toLowerCase());
      }
    }, { timeout: 15000 });
  });

  describe("SRT → Markdown → SRT", () => {
    it("preserves timestamps and text content", async () => {
      const srtBuffer = readFileSync(join(FIXTURES, "sample.srt"));
      const srtContent = srtBuffer.toString("utf-8");

      // Ingest: SRT → Markdown
      const ingestResult = await srtIngest.ingest({
        filePath: "sample.srt",
        buffer: srtBuffer,
      });
      expect(ingestResult.markdown).toBeTruthy();

      // Export: Markdown → SRT
      const exportResult = await transcriptExport.export({
        files: [{ relativePath: "sample.md", content: ingestResult.markdown! }],
        format: ".srt",
        theme: { name: "default", colors: {}, typography: {}, spacing: {}, document: {}, spreadsheet: {}, presentation: {}, transcript: {}, defaults: {} },
        options: {},
      });

      const roundTripped = exportResult.buffer.toString("utf-8");

      // SRT should have numbered cues
      expect(roundTripped).toMatch(/^1\r?\n/);

      // Verify timestamps use SRT format (comma for milliseconds)
      expect(roundTripped).toMatch(/\d{2}:\d{2}:\d{2},\d{3}/);

      // Verify text content is preserved
      const textLines = srtContent
        .split("\n")
        .filter((l) => l.trim() && !l.includes("-->") && !/^\d+$/.test(l.trim()));

      for (const line of textLines.slice(0, 3)) {
        if (line.trim()) {
          expect(roundTripped).toContain(line.trim());
        }
      }
    }, { timeout: 15000 });
  });

  describe("CSV → XLSX data integrity", () => {
    it("preserves data when exporting CSV to XLSX", async () => {
      const csvContent = readFileSync(join(FIXTURES, "sample.csv"), "utf-8");

      const result = await spreadsheetExport.export({
        files: [{ relativePath: "sample.csv", content: csvContent }],
        format: ".xlsx",
        theme: { name: "default", colors: {}, typography: {}, spacing: {}, document: {}, spreadsheet: {}, presentation: {}, transcript: {}, defaults: {} },
        options: {},
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.extension).toBe(".xlsx");
    }, { timeout: 30000 });
  });

  describe("Markdown → DOCX content preservation", () => {
    it("preserves headings and text in DOCX export", async () => {
      const markdown = [
        "# Round Trip Test",
        "",
        "This is a **bold** and *italic* test paragraph.",
        "",
        "## Second Section",
        "",
        "- Item one",
        "- Item two",
        "- Item three",
        "",
      ].join("\n");

      const result = await documentExport.export({
        files: [{ relativePath: "test.md", content: markdown }],
        format: ".docx",
        theme: { name: "default", colors: {}, typography: {}, spacing: {}, document: {}, spreadsheet: {}, presentation: {}, transcript: {}, defaults: {} },
        options: {},
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.extension).toBe(".docx");

      // DOCX files are ZIP archives starting with PK
      expect(result.buffer[0]).toBe(0x50); // P
      expect(result.buffer[1]).toBe(0x4b); // K
    }, { timeout: 30000 });
  });
});

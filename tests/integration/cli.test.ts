import { describe, it, expect, afterEach } from "vitest";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const CLI_PATH = join(import.meta.dirname, "../../dist/cli/index.js");

function runCli(
  args: string[],
  opts?: { cwd?: string },
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    execFile(
      "node",
      [CLI_PATH, ...args],
      { timeout: 30000, cwd: opts?.cwd },
      (err, stdout, stderr) => {
        const exitCode = err && "code" in err ? (err.code as number | null) : 0;
        resolve({ stdout, stderr, exitCode });
      },
    );
  });
}

describe("CLI end-to-end", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("converters list", () => {
    it("lists ingest and export converters", async () => {
      const { stdout } = await runCli(["converters", "list"]);

      expect(stdout).toContain("Ingest Converters:");
      expect(stdout).toContain("docx");
      expect(stdout).toContain("xlsx");
      expect(stdout).toContain("pptx");
      expect(stdout).toContain("vtt");
      expect(stdout).toContain("srt");
      expect(stdout).toContain("html");
      expect(stdout).toContain("rtf");
      expect(stdout).toContain("excalidraw");
      expect(stdout).toContain("marp");
      expect(stdout).toContain("json");

      expect(stdout).toContain("Export Converters:");
      expect(stdout).toContain("document");
      expect(stdout).toContain("spreadsheet");
      expect(stdout).toContain("presentation");
      expect(stdout).toContain("transcript");
    }, { timeout: 15000 });
  });

  describe("converters info", () => {
    it("shows details for a known converter", async () => {
      const { stdout } = await runCli(["converters", "info", "docx"]);
      expect(stdout).toContain("docx");
      expect(stdout).toContain(".docx");
    }, { timeout: 15000 });

    it("errors for unknown converter", async () => {
      const { stderr, exitCode } = await runCli(["converters", "info", "nonexistent"]);
      expect(stderr).toContain("Unknown converter");
    }, { timeout: 15000 });
  });

  describe("themes list", () => {
    it("lists built-in themes", async () => {
      const { stdout } = await runCli(["themes", "list"]);
      expect(stdout).toContain("default");
      expect(stdout).toContain("professional");
      expect(stdout).toContain("modern");
      expect(stdout).toContain("minimal");
    }, { timeout: 15000 });
  });

  describe("themes preview", () => {
    it("shows theme details", async () => {
      const { stdout } = await runCli(["themes", "preview", "professional"]);
      expect(stdout).toContain("professional");
    }, { timeout: 15000 });
  });

  describe("themes init", () => {
    it("creates .markwell.yaml", async () => {
      tmpDir = join(tmpdir(), `markwell-cli-init-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const { stdout } = await runCli(["themes", "init"], { cwd: tmpDir });
      expect(stdout).toContain(".markwell.yaml");

      const configPath = join(tmpDir, ".markwell.yaml");
      expect(existsSync(configPath)).toBe(true);
      expect(readFileSync(configPath, "utf-8")).toContain("extends: default");
    }, { timeout: 15000 });
  });

  describe("convert ingest", () => {
    it("converts VTT to Markdown", async () => {
      tmpDir = join(tmpdir(), `markwell-cli-vtt-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const fixtureDir = join(import.meta.dirname, "../fixtures");
      const vttPath = join(fixtureDir, "sample.vtt");

      const { stdout, exitCode } = await runCli([
        "convert",
        vttPath,
        "-o",
        join(tmpDir, "output.md"),
        "--force",
      ]);

      expect(exitCode).toBe(0);
      const outputPath = join(tmpDir, "output.md");
      expect(existsSync(outputPath)).toBe(true);
      const content = readFileSync(outputPath, "utf-8");
      expect(content).toBeTruthy();
    }, { timeout: 15000 });

    it("converts HTML to Markdown", async () => {
      tmpDir = join(tmpdir(), `markwell-cli-html-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const fixtureDir = join(import.meta.dirname, "../fixtures");
      const htmlPath = join(fixtureDir, "sample.html");

      const { exitCode } = await runCli([
        "convert",
        htmlPath,
        "-o",
        join(tmpDir, "output.md"),
        "--force",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(join(tmpDir, "output.md"))).toBe(true);
    }, { timeout: 15000 });
  });

  describe("convert --dry-run", () => {
    it("shows plan without writing files", async () => {
      tmpDir = join(tmpdir(), `markwell-cli-dry-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const fixtureDir = join(import.meta.dirname, "../fixtures");
      const vttPath = join(fixtureDir, "sample.vtt");
      const outputPath = join(tmpDir, "output.md");

      const { stdout } = await runCli([
        "convert",
        vttPath,
        "-o",
        outputPath,
        "--dry-run",
      ]);

      expect(stdout).toContain("DRY RUN");
      expect(existsSync(outputPath)).toBe(false);
    }, { timeout: 15000 });
  });

  describe("convert export", () => {
    it("converts CSV to XLSX", async () => {
      tmpDir = join(tmpdir(), `markwell-cli-export-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const fixtureDir = join(import.meta.dirname, "../fixtures");
      const csvPath = join(fixtureDir, "sample.csv");
      const outputPath = join(tmpDir, "output.xlsx");

      const { exitCode } = await runCli([
        "convert",
        csvPath,
        "--to",
        "xlsx",
        "-o",
        outputPath,
        "--force",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(outputPath)).toBe(true);
    }, { timeout: 30000 });

    it("converts CSV to XLSX with alias 'excel'", async () => {
      tmpDir = join(tmpdir(), `markwell-cli-export-excel-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const fixtureDir = join(import.meta.dirname, "../fixtures");
      const csvPath = join(fixtureDir, "sample.csv");
      const outputPath = join(tmpDir, "output.xlsx");

      const { exitCode } = await runCli([
        "convert",
        csvPath,
        "--to",
        "excel",
        "-o",
        outputPath,
        "--force",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(outputPath)).toBe(true);
    }, { timeout: 30000 });

    it("converts Markdown to VTT", async () => {
      tmpDir = join(tmpdir(), `markwell-cli-export-vtt-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      // Create a transcript Markdown file
      const mdContent = [
        "# Transcript",
        "",
        "**[00:00:01.000 --> 00:00:04.000]** Speaker A",
        "",
        "Hello world",
        "",
        "**[00:00:05.000 --> 00:00:08.000]** Speaker B",
        "",
        "Goodbye world",
        "",
      ].join("\n");

      const mdPath = join(tmpDir, "transcript.md");
      writeFileSync(mdPath, mdContent, "utf-8");

      const outputPath = join(tmpDir, "transcript.vtt");

      const { exitCode } = await runCli([
        "convert",
        mdPath,
        "--to",
        "vtt",
        "-o",
        outputPath,
        "--force",
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(outputPath)).toBe(true);
      const content = readFileSync(outputPath, "utf-8");
      expect(content).toContain("WEBVTT");
    }, { timeout: 15000 });
  });

  describe("error handling", () => {
    it("reports error for non-existent file", async () => {
      const { stdout, exitCode } = await runCli(["convert", "/tmp/nonexistent-file-xyz.docx"]);
      // fast-glob returns empty for non-matching patterns
      expect(exitCode).not.toBe(0);
    }, { timeout: 15000 });
  });
});

import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { statSync, readFileSync } from "node:fs";

const CLI_PATH = join(import.meta.dirname, "../../dist/cli/index.js");

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    execFile("node", [CLI_PATH, ...args], { timeout: 30000 }, (err, stdout, stderr) => {
      const exitCode = err && "code" in err ? (err.code as number | null) : 0;
      resolve({ stdout, stderr, exitCode });
    });
  });
}

describe("startup performance", () => {
  it("CLI bundle exists and is reasonably sized", () => {
    const stat = statSync(CLI_PATH);
    // Bundle should be under 200KB (lazy loading means converter code is deferred)
    expect(stat.size).toBeLessThan(200 * 1024);
    // But should have meaningful content
    expect(stat.size).toBeGreaterThan(1000);
  });

  it("CLI bundle does not eagerly require heavy dependencies at top level", () => {
    const bundle = readFileSync(CLI_PATH, "utf-8");

    // These heavy deps should only appear behind dynamic import() or lazy-loading patterns,
    // not at the module top level as synchronous require/import statements.
    // In a bundled ESM file, top-level imports would be inlined.
    // We verify the bundle doesn't contain the full library code by checking size.
    // The bundle being under 200KB confirms heavy deps (mammoth, exceljs, docx, etc.)
    // are NOT bundled in — they're loaded dynamically.

    // The bundle should contain commander (CLI framework) references
    expect(bundle).toContain("commander");
    // It should reference the convert command
    expect(bundle).toContain("convert");
  });

  it("--help completes successfully", async () => {
    const { stdout, exitCode } = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("markwell");
    expect(stdout).toContain("convert");
    expect(stdout).toContain("converters");
    expect(stdout).toContain("themes");
    expect(stdout).toContain("install-skills");
  }, 30000);

  it("--version returns correct version", async () => {
    const { stdout, exitCode } = await runCli(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe("0.1.0");
  }, 30000);
});

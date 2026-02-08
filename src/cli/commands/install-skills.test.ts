import { describe, it, expect, afterEach } from "vitest";
import {
  existsSync,
  readFileSync,
  rmSync,
  mkdirSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const skillSourcePath = join(
  import.meta.dirname,
  "../../../src/skills/markwell.md",
);

describe("install-skills", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("skill template file exists", () => {
    expect(existsSync(skillSourcePath)).toBe(true);
  });

  it("skill template contains usage examples", () => {
    const content = readFileSync(skillSourcePath, "utf-8");
    expect(content).toContain("markwell convert");
    expect(content).toContain("--to document");
    expect(content).toContain("--to spreadsheet");
    expect(content).toContain("--to presentation");
    expect(content).toContain("--to transcript");
  });

  it("copies skill file to target directory", () => {
    tmpDir = join(tmpdir(), `markwell-skill-${Date.now()}`);
    const targetDir = join(tmpDir, ".claude", "commands");
    mkdirSync(targetDir, { recursive: true });
    const targetPath = join(targetDir, "markwell.md");

    copyFileSync(skillSourcePath, targetPath);

    expect(existsSync(targetPath)).toBe(true);
    const content = readFileSync(targetPath, "utf-8");
    expect(content).toContain("Markwell");
  });

  it("creates directories if they don't exist", () => {
    tmpDir = join(tmpdir(), `markwell-skill-mkdir-${Date.now()}`);
    const targetDir = join(tmpDir, ".claude", "commands");

    expect(existsSync(targetDir)).toBe(false);
    mkdirSync(targetDir, { recursive: true });
    expect(existsSync(targetDir)).toBe(true);
  });
});

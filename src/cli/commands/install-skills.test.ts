import { describe, it, expect, afterEach } from "vitest";
import {
  existsSync,
  readFileSync,
  rmSync,
  mkdirSync,
  cpSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const skillSourceDir = join(
  import.meta.dirname,
  "../../../src/skills/markwell",
);
const skillSourceFile = join(skillSourceDir, "SKILL.md");

describe("install-skills", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("skill template file exists", () => {
    expect(existsSync(skillSourceFile)).toBe(true);
  });

  it("skill template contains usage examples", () => {
    const content = readFileSync(skillSourceFile, "utf-8");
    expect(content).toContain("markwell convert");
    expect(content).toContain("--to document");
    expect(content).toContain("--to spreadsheet");
    expect(content).toContain("--to presentation");
    expect(content).toContain("--to transcript");
  });

  it("copies skill directory to target", () => {
    tmpDir = join(tmpdir(), `markwell-skill-${Date.now()}`);
    const targetDir = join(tmpDir, ".claude", "skills", "markwell");
    mkdirSync(targetDir, { recursive: true });

    cpSync(skillSourceDir, targetDir, { recursive: true });

    const targetFile = join(targetDir, "SKILL.md");
    expect(existsSync(targetFile)).toBe(true);
    const content = readFileSync(targetFile, "utf-8");
    expect(content).toContain("Markwell");
  });

  it("creates directories if they don't exist", () => {
    tmpDir = join(tmpdir(), `markwell-skill-mkdir-${Date.now()}`);
    const targetDir = join(tmpDir, ".claude", "skills", "markwell");

    expect(existsSync(targetDir)).toBe(false);
    mkdirSync(targetDir, { recursive: true });
    expect(existsSync(targetDir)).toBe(true);
  });
});

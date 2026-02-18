import type { Command } from "commander";
import { existsSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

function getSkillSourceDir(): string {
  // Paths are relative to the bundled output at dist/cli/index.js.
  // In dev the src/ tree sits alongside dist/; in a published package
  // only dist/ exists.
  const devPath = join(import.meta.dirname, "../../src/skills/markwell");
  if (existsSync(devPath)) return devPath;
  const distPath = join(import.meta.dirname, "../skills/markwell");
  if (existsSync(distPath)) return distPath;
  return distPath; // fallback
}

export function registerInstallSkillsCommand(program: Command): void {
  program
    .command("install-skills")
    .description("Install Claude Code skill file")
    .option("--global", "Install to ~/.claude/ instead of project .claude/")
    .action((opts: { global?: boolean }) => {
      const sourceDir = getSkillSourceDir();
      const sourceFile = join(sourceDir, "SKILL.md");

      if (!existsSync(sourceFile)) {
        console.error("Skill template not found. Package may be corrupted.");
        process.exitCode = 1;
        return;
      }

      let targetDir: string;
      if (opts.global) {
        targetDir = join(homedir(), ".claude", "skills", "markwell");
      } else {
        targetDir = join(process.cwd(), ".claude", "skills", "markwell");
      }

      // Create directory and copy skill files
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      cpSync(sourceDir, targetDir, { recursive: true });

      const location = opts.global ? "global (~/.claude/)" : "project (.claude/)";
      console.log(`Installed markwell skill to ${location}`);
      console.log(`  ${join(targetDir, "SKILL.md")}`);
    });
}

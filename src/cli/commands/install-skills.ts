import type { Command } from "commander";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

function getSkillSourcePath(): string {
  // In dev: src/skills/. In dist: dist/skills/
  const devPath = join(import.meta.dirname, "../../../src/skills/markwell.md");
  if (existsSync(devPath)) return devPath;
  const distPath = join(import.meta.dirname, "../../skills/markwell.md");
  if (existsSync(distPath)) return distPath;
  return devPath; // fallback
}

export function registerInstallSkillsCommand(program: Command): void {
  program
    .command("install-skills")
    .description("Install Claude Code skill file")
    .option("--global", "Install to ~/.claude/ instead of project .claude/")
    .action((opts: { global?: boolean }) => {
      const sourcePath = getSkillSourcePath();

      if (!existsSync(sourcePath)) {
        console.error("Skill template not found. Package may be corrupted.");
        process.exitCode = 1;
        return;
      }

      let targetDir: string;
      if (opts.global) {
        targetDir = join(homedir(), ".claude", "commands");
      } else {
        targetDir = join(process.cwd(), ".claude", "commands");
      }

      const targetPath = join(targetDir, "markwell.md");

      // Create directory if needed
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      copyFileSync(sourcePath, targetPath);

      const location = opts.global ? "global (~/.claude/)" : "project (.claude/)";
      console.log(`Installed markwell skill to ${location}`);
      console.log(`  ${targetPath}`);
    });
}

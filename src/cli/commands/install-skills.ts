import type { Command } from "commander";

export function registerInstallSkillsCommand(program: Command): void {
  program
    .command("install-skills")
    .description("Install Claude Code skill file")
    .option("--global", "Install to ~/.claude/ instead of project .claude/")
    .action((_opts: { global?: boolean }) => {
      console.log("Install skills (not yet implemented)");
    });
}

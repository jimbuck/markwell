import type { Command } from "commander";

export function registerThemesCommand(program: Command): void {
  const themes = program.command("themes").description("Manage themes");

  themes
    .command("list")
    .description("List available themes")
    .action(() => {
      console.log("Themes list (not yet implemented)");
    });

  themes
    .command("preview <name>")
    .description("Preview a theme")
    .action((name: string) => {
      console.log(`Theme preview for "${name}" (not yet implemented)`);
    });

  themes
    .command("init")
    .description("Create a starter .markwell.yaml in the current directory")
    .action(() => {
      console.log("Theme init (not yet implemented)");
    });
}

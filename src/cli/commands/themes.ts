import type { Command } from "commander";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveTheme,
  listBuiltinThemes,
  findThemeFile,
} from "../../core/theme-loader.js";

const STARTER_THEME = `# Markwell Theme Configuration
# See: markwell themes preview default

extends: default

# Uncomment and customize:
# colors:
#   primary: "2B579A"
#   accent: "4472C4"
#   text: "333333"

# document:
#   margins:
#     top: 1440
#     bottom: 1440
#     left: 1440
#     right: 1440
#   header: "{title}"
#   footer: "Page {page}"

# spreadsheet:
#   headerBackground: "$accent"
#   headerTextColor: "FFFFFF"

# presentation:
#   paginate: true
`;

export function registerThemesCommand(program: Command): void {
  const themes = program.command("themes").description("Manage themes");

  themes
    .command("list")
    .description("List available themes")
    .action(() => {
      console.log("Built-in themes:");
      console.log("");

      const descriptions: Record<string, string> = {
        default: "Clean, minimal styling with Calibri font",
        professional:
          "Corporate/consulting style with darker colors and stricter spacing",
        modern: "Contemporary with bolder accent colors and Segoe UI font",
        minimal: "Stripped down, content-focused with fewer decorative elements",
      };

      for (const name of listBuiltinThemes()) {
        console.log(`  ${name.padEnd(16)} ${descriptions[name] ?? ""}`);
      }

      // Check for local theme file
      const localTheme = findThemeFile(join(process.cwd(), "placeholder"));
      if (localTheme) {
        console.log("");
        console.log("Local theme:");
        console.log(`  ${localTheme}`);
      }
    });

  themes
    .command("preview <name>")
    .description("Preview a theme's resolved settings")
    .action((name: string) => {
      const warnings: string[] = [];
      const theme = resolveTheme({
        themeName: name,
        onWarning: (w) => warnings.push(w),
      });

      for (const w of warnings) {
        console.warn(w);
      }

      console.log(`Theme: ${theme.name}`);
      console.log("");

      // Colors
      console.log("Colors:");
      for (const [key, value] of Object.entries(theme.colors)) {
        console.log(`  ${key.padEnd(14)} #${value}`);
      }
      console.log("");

      // Typography
      console.log("Typography:");
      for (const [key, value] of Object.entries(theme.typography)) {
        if (typeof value === "object") {
          console.log(`  ${key}:`);
          for (const [k, v] of Object.entries(
            value as Record<string, unknown>,
          )) {
            console.log(`    ${k}: ${v}`);
          }
        } else {
          console.log(`  ${key.padEnd(14)} ${value}`);
        }
      }
      console.log("");

      // Spacing
      console.log("Spacing:");
      for (const [key, value] of Object.entries(theme.spacing)) {
        console.log(`  ${key.padEnd(18)} ${value}`);
      }
      console.log("");

      // Category sections
      const categories = [
        "document",
        "spreadsheet",
        "presentation",
        "transcript",
      ] as const;
      for (const cat of categories) {
        const section = theme[cat];
        if (section && Object.keys(section).length > 0) {
          console.log(`${cat.charAt(0).toUpperCase() + cat.slice(1)}:`);
          printObject(section, 1);
          console.log("");
        }
      }
    });

  themes
    .command("init")
    .description("Create a starter .markwell.yaml in the current directory")
    .option("--force", "Overwrite existing .markwell.yaml")
    .action((opts: { force?: boolean }) => {
      const targetPath = join(process.cwd(), ".markwell.yaml");

      if (existsSync(targetPath) && !opts.force) {
        console.error(
          ".markwell.yaml already exists. Use --force to overwrite.",
        );
        process.exitCode = 1;
        return;
      }

      writeFileSync(targetPath, STARTER_THEME, "utf-8");
      console.log("Created .markwell.yaml");
    });
}

function printObject(obj: Record<string, unknown>, indent: number): void {
  const prefix = "  ".repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      console.log(`${prefix}${key}:`);
      printObject(value as Record<string, unknown>, indent + 1);
    } else {
      console.log(`${prefix}${key.padEnd(18)} ${value}`);
    }
  }
}

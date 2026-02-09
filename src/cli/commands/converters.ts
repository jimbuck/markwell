import type { Command } from "commander";
import { getRegistry } from "../setup-registry.js";
import { getAliasesForCategory } from "../../core/format-aliases.js";

export function registerConvertersCommand(program: Command): void {
  const converters = program
    .command("converters")
    .description("List and inspect converters");

  converters
    .command("list")
    .description("List all registered ingest and export converters")
    .action(() => {
      const registry = getRegistry();

      const ingestList = registry.listIngest();
      const exportList = registry.listExport();

      console.log("Ingest Converters:");
      if (ingestList.length === 0) {
        console.log("  (none registered)");
      } else {
        for (const c of ingestList) {
          console.log(`  ${c.name.padEnd(15)} ${c.extensions.join(", ")}`);
        }
      }

      console.log("\nExport Converters:");
      if (exportList.length === 0) {
        console.log("  (none registered)");
      } else {
        for (const c of exportList) {
          const formats = c.formats.map((f) => f.extension).join(", ");
          const aliases = getAliasesForCategory(c.category);
          const aliasStr = aliases.length > 0 ? `  aliases: ${aliases.join(", ")}` : "";
          console.log(
            `  ${c.name.padEnd(15)} [${c.category}] ${formats}${aliasStr}`,
          );
        }
      }
    });

  converters
    .command("info <name>")
    .description("Show details about a specific converter")
    .action((name: string) => {
      const registry = getRegistry();

      const ingest = registry.listIngest().find((c) => c.name === name);
      if (ingest) {
        console.log(`Converter: ${ingest.name} (ingest)`);
        console.log(`Extensions: ${ingest.extensions.join(", ")}`);
        return;
      }

      const exp = registry.listExport().find((c) => c.name === name);
      if (exp) {
        console.log(`Converter: ${exp.name} (export)`);
        console.log(`Category: ${exp.category}`);
        console.log("Formats:");
        for (const f of exp.formats) {
          console.log(`  ${f.extension} — ${f.label} (${f.mimeType})`);
        }
        return;
      }

      console.error(`Unknown converter: "${name}"`);
      process.exitCode = 1;
    });
}

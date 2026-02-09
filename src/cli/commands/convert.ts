import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import type { Command } from "commander";
import fg from "fast-glob";
import { getRegistry } from "../setup-registry.js";
import * as logger from "../../core/logger.js";
import { resolveToFlag } from "../../core/format-aliases.js";

export function resolveOutputPath(
  inputFilePath: string,
  outputExtension: string,
  outputFlag?: string,
): string {
  const inputDir = path.dirname(inputFilePath);
  const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
  const defaultOutput = path.join(inputDir, `${baseName}${outputExtension}`);

  if (!outputFlag) {
    return defaultOutput;
  }

  // If -o points to a directory (ends with / or is an existing directory), put file inside it
  if (outputFlag.endsWith(path.sep) || outputFlag.endsWith("/")) {
    return path.join(outputFlag, `${baseName}${outputExtension}`);
  }

  try {
    const stat = fs.statSync(outputFlag);
    if (stat.isDirectory()) {
      return path.join(outputFlag, `${baseName}${outputExtension}`);
    }
  } catch {
    // Path doesn't exist yet — treat as explicit file path
  }

  return outputFlag;
}

async function confirmOverwrite(filePath: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    logger.error(
      `${filePath} already exists. Use --force to overwrite in non-interactive mode.`,
    );
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<boolean>((resolve) => {
    rl.question(`${filePath} already exists. Overwrite? [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

interface ConvertOptions {
  to?: string;
  output?: string;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  theme?: string;
}

export function registerConvertCommand(program: Command): void {
  program
    .command("convert")
    .description("Convert files to or from Markdown")
    .argument("<file-or-glob>", "File path or glob pattern to convert")
    .option("--to <format>", "Export format(s): docx, pptx, pdf, xlsx, vtt, srt, etc.")
    .option("-o, --output <path>", "Output file or directory path")
    .option("--force", "Overwrite existing files without prompting")
    .option("--dry-run", "Show what would be done without writing files")
    .option("--verbose", "Show detailed processing information")
    .option("--theme <name-or-path>", "Theme name or path to .markwell.yaml")
    .action(async (fileOrGlob: string, opts: ConvertOptions) => {
      if (opts.verbose) {
        logger.setVerbose(true);
      }

      const registry = getRegistry();

      // Expand glob pattern
      const files = await fg(fileOrGlob, { absolute: true });

      if (files.length === 0) {
        logger.error(`No files found matching "${fileOrGlob}"`);
        process.exitCode = 1;
        return;
      }

      let succeeded = 0;
      let failed = 0;
      const failures: { file: string; error: string }[] = [];

      for (const filePath of files) {
        try {
          const buffer = await fsp.readFile(filePath);
          const startTime = performance.now();

          if (opts.to) {
            // ── Export mode ──
            const inputContent = buffer.toString("utf-8");
            const targets = resolveToFlag(opts.to, { inputContent });

            // Validate: -o as specific file not allowed with multiple targets
            if (targets.length > 1 && opts.output) {
              const hasExt = path.extname(opts.output) !== "";
              const isDir =
                opts.output.endsWith(path.sep) ||
                opts.output.endsWith("/");
              let existingDir = false;
              try {
                existingDir = fs.statSync(opts.output).isDirectory();
              } catch {
                // doesn't exist yet
              }
              if (hasExt && !isDir && !existingDir) {
                throw new Error(
                  "Cannot use -o with a specific file path when exporting to multiple formats. Use a directory instead.",
                );
              }
            }

            for (const target of targets) {
              const converter = registry.resolveExport(
                target.category,
                target.extension.slice(1), // strip leading dot
              );
              if (!converter) {
                throw new Error(
                  `No export converter found for "${target.category}" with format "${target.extension}"`,
                );
              }

              const outputPath = resolveOutputPath(
                filePath,
                target.extension,
                opts.output,
              );

              logger.verbose(
                `Using export converter: ${converter.name} (${target.extension})`,
              );

              if (opts.dryRun) {
                logger.info(
                  `[DRY RUN] ${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), outputPath)}`,
                );
                succeeded++;
                continue;
              }

              // Check overwrite
              if (fs.existsSync(outputPath) && !opts.force) {
                const ok = await confirmOverwrite(outputPath);
                if (!ok) {
                  logger.info(
                    `${path.relative(process.cwd(), filePath)} -> skipped`,
                  );
                  continue;
                }
              }

              // TODO: Theme resolution will be added in task 1100
              const theme = {
                name: "default",
                colors: {},
                typography: {},
                spacing: {},
                document: {},
                spreadsheet: {},
                presentation: {},
                transcript: {},
                defaults: {},
              };

              const result = await converter.export({
                files: [
                  {
                    relativePath: path.basename(filePath),
                    content: inputContent,
                  },
                ],
                format: target.extension,
                theme,
                options: {},
              });

              await fsp.mkdir(path.dirname(outputPath), { recursive: true });
              await fsp.writeFile(outputPath, result.buffer);

              const duration = performance.now() - startTime;
              logger.verbose(`Completed in ${duration.toFixed(0)}ms`);
              logger.info(
                `${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), outputPath)}  [OK]`,
              );
              succeeded++;
            }
          } else {
            // ── Ingest mode ──
            const converter = await registry.resolveIngest(filePath, buffer);
            if (!converter) {
              throw new Error(
                `No ingest converter found for "${path.basename(filePath)}"`,
              );
            }

            logger.verbose(`Using ingest converter: ${converter.name}`);

            const result = await converter.ingest({ filePath, buffer });

            if (result.markdown) {
              const outputPath = resolveOutputPath(filePath, ".md", opts.output);

              if (opts.dryRun) {
                logger.info(
                  `[DRY RUN] ${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), outputPath)}`,
                );
                succeeded++;
                continue;
              }

              if (fs.existsSync(outputPath) && !opts.force) {
                const ok = await confirmOverwrite(outputPath);
                if (!ok) {
                  logger.info(
                    `${path.relative(process.cwd(), filePath)} -> skipped`,
                  );
                  continue;
                }
              }

              await fsp.mkdir(path.dirname(outputPath), { recursive: true });
              await fsp.writeFile(outputPath, result.markdown, "utf-8");

              // Write assets if any
              if (result.assets && result.assets.size > 0) {
                const assetsDir = path.join(
                  path.dirname(outputPath),
                  "assets",
                );
                await fsp.mkdir(assetsDir, { recursive: true });
                for (const [assetPath, assetBuffer] of result.assets) {
                  await fsp.writeFile(
                    path.join(assetsDir, assetPath),
                    assetBuffer,
                  );
                }
              }

              const duration = performance.now() - startTime;
              logger.verbose(`Completed in ${duration.toFixed(0)}ms`);
              logger.info(
                `${path.relative(process.cwd(), filePath)} -> ${path.relative(process.cwd(), outputPath)}  [OK]`,
              );
              succeeded++;
            } else if (result.files && result.files.length > 0) {
              const baseName = path.basename(
                filePath,
                path.extname(filePath),
              );
              const outputDir = opts.output
                ? opts.output
                : path.join(path.dirname(filePath), baseName);

              if (opts.dryRun) {
                const outputs = result.files
                  .map((f) =>
                    path.relative(
                      process.cwd(),
                      path.join(outputDir, f.relativePath),
                    ),
                  )
                  .join(", ");
                logger.info(
                  `[DRY RUN] ${path.relative(process.cwd(), filePath)} -> ${outputs}`,
                );
                succeeded++;
                continue;
              }

              await fsp.mkdir(outputDir, { recursive: true });

              const outputPaths: string[] = [];
              for (const file of result.files) {
                const outPath = path.join(outputDir, file.relativePath);
                if (fs.existsSync(outPath) && !opts.force) {
                  const ok = await confirmOverwrite(outPath);
                  if (!ok) continue;
                }
                await fsp.mkdir(path.dirname(outPath), { recursive: true });
                await fsp.writeFile(outPath, file.content, "utf-8");
                outputPaths.push(path.relative(process.cwd(), outPath));
              }

              const duration = performance.now() - startTime;
              logger.verbose(`Completed in ${duration.toFixed(0)}ms`);
              logger.info(
                `${path.relative(process.cwd(), filePath)} -> ${outputPaths.join(", ")}  [OK]`,
              );
              succeeded++;
            } else {
              throw new Error("Converter returned no output");
            }
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : String(err);
          logger.info(
            `${path.relative(process.cwd(), filePath)} -> [FAILED] ${message}`,
          );
          failed++;
          failures.push({ file: filePath, error: message });
        }
      }

      // Summary
      if (files.length > 1 || failed > 0) {
        console.log(
          `\n${files.length} file${files.length === 1 ? "" : "s"} processed: ${succeeded} succeeded, ${failed} failed`,
        );
      }

      if (failed > 0) {
        process.exitCode = 1;
      }
    });
}

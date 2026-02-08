import type {
  ExportConverter,
  ExportInput,
  ExportOutput,
  ResolvedTheme,
} from "../core/types.js";

async function loadMarpCore() {
  const mod = await import("@marp-team/marp-core");
  return mod.Marp ?? (mod.default as { Marp: typeof mod.Marp }).Marp;
}

function buildMarpFrontmatter(
  theme: ResolvedTheme,
  existingContent: string,
): string {
  const directives: string[] = [];

  directives.push("marp: true");

  const presTheme = theme.presentation?.theme as string | undefined;
  if (presTheme) {
    directives.push(`theme: ${presTheme}`);
  }

  const paginate = theme.presentation?.paginate as boolean | undefined;
  if (paginate !== undefined) {
    directives.push(`paginate: ${paginate}`);
  }

  const backgroundColor = theme.presentation?.backgroundColor as
    | string
    | undefined;
  if (backgroundColor) {
    directives.push(`backgroundColor: ${backgroundColor}`);
  }

  const header = theme.presentation?.header as string | undefined;
  if (header) {
    directives.push(`header: "${header}"`);
  }

  const footer = theme.presentation?.footer as string | undefined;
  if (footer) {
    directives.push(`footer: "${footer}"`);
  }

  // Check if content already has frontmatter
  const fmMatch = existingContent.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/,
  );

  if (fmMatch) {
    // Merge: theme directives take precedence
    const existingLines = fmMatch[1].split("\n");
    const directiveKeys = new Set(directives.map((d) => d.split(":")[0]));
    const kept = existingLines.filter((line) => {
      const key = line.split(":")[0].trim();
      return !directiveKeys.has(key);
    });
    const merged = [...directives, ...kept].filter((l) => l.trim());
    return `---\n${merged.join("\n")}\n---\n\n${fmMatch[2]}`;
  }

  return `---\n${directives.join("\n")}\n---\n\n${existingContent}`;
}

function buildCustomStyle(theme: ResolvedTheme): string {
  const parts: string[] = [];

  const primaryColor = theme.colors?.primary;
  if (primaryColor) {
    parts.push(`h1, h2, h3 { color: #${primaryColor}; }`);
  }

  const fontFamily = theme.typography?.fontFamily as string | undefined;
  if (fontFamily) {
    parts.push(`section { font-family: '${fontFamily}', sans-serif; }`);
  }

  const customStyle = theme.presentation?.style as string | undefined;
  if (customStyle) {
    parts.push(customStyle);
  }

  return parts.join("\n");
}

export const presentationExport: ExportConverter = {
  name: "presentation",
  category: "presentation",
  formats: [
    {
      extension: ".html",
      mimeType: "text/html",
      label: "HTML Presentation",
    },
    {
      extension: ".pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      label: "PowerPoint Presentation",
    },
    {
      extension: ".pdf",
      mimeType: "application/pdf",
      label: "PDF Presentation",
    },
  ],

  async export(input: ExportInput): Promise<ExportOutput> {
    const format = input.format;
    const content = input.files[0]?.content ?? "";
    const theme = input.theme;

    if (format === ".html") {
      return renderHtml(content, theme);
    }

    if (format === ".pptx" || format === ".pdf") {
      return renderViaCli(content, theme, format);
    }

    throw new Error(`Unsupported presentation format: ${format}`);
  },
};

async function renderHtml(
  content: string,
  theme: ResolvedTheme,
): Promise<ExportOutput> {
  const Marp = await loadMarpCore();
  const marp = new Marp({ html: true, script: false });

  const prepared = buildMarpFrontmatter(theme, content);
  const customStyle = buildCustomStyle(theme);
  const { html, css } = marp.render(prepared);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${css}</style>
${customStyle ? `<style>${customStyle}</style>` : ""}
</head>
<body>
${html}
</body>
</html>`;

  return {
    buffer: Buffer.from(fullHtml, "utf-8"),
    mimeType: "text/html",
    extension: ".html",
  };
}

async function renderViaCli(
  content: string,
  theme: ResolvedTheme,
  format: string,
): Promise<ExportOutput> {
  const { writeFile, mkdtemp, readFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  const prepared = buildMarpFrontmatter(theme, content);
  const tmpDir = await mkdtemp(join(tmpdir(), "markwell-"));

  try {
    const inputPath = join(tmpDir, "input.md");
    const ext = format;
    const outputPath = join(tmpDir, `output${ext}`);

    await writeFile(inputPath, prepared, "utf-8");

    const args = [inputPath, "-o", outputPath];
    if (format === ".pptx") args.push("--pptx");
    if (format === ".pdf") args.push("--pdf");

    // Resolve the marp-cli entry point from node_modules
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const marpCliEntry = require.resolve("@marp-team/marp-cli/marp-cli.js");

    await execFileAsync(process.execPath, [marpCliEntry, ...args], {
      cwd: tmpDir,
      timeout: 60000,
    });

    const buffer = await readFile(outputPath);

    const mimeTypes: Record<string, string> = {
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".pdf": "application/pdf",
    };

    return {
      buffer,
      mimeType: mimeTypes[format] ?? "application/octet-stream",
      extension: format,
    };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

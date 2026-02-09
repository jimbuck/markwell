# Markwell

Convert documents to and from Markdown. The source from which polished documents flow.

Markwell gives Claude Code and AI agents the ability to **transform** documents — Word files, spreadsheets, presentations, and transcripts — using Markdown as the universal hub format. Install it once, and your agent gains a complete document toolkit.

## Why Markwell?

AI agents work in plain text. Documents live in binary formats like `.docx`, `.xlsx`, and `.pptx`. Markwell bridges this gap:

- **Ingest** any supported document into Markdown so an agent can read and reason about it
- **Export** Markdown back into polished, styled documents ready for sharing
- **Theme** exports with professional styling — no manual formatting needed

```
  .docx ─┐                    ┌─ .docx
  .xlsx ─┤                    ├─ .xlsx
  .pptx ─┤   ┌──────────┐    ├─ .pptx / .html / .pdf
  .vtt  ─┤──▶│ Markdown  │──▶ ├─ .vtt / .srt
  .srt  ─┤   └──────────┘    └─ (themed output)
  .html ─┤    Hub Format
  .rtf  ─┤
  .json ─┘
```

## Install

```bash
npm install -g markwell
```

Requires Node.js 20 or later. All dependencies are included — no additional system software needed.

### Claude Code Integration

Install the Markwell skill so Claude Code knows how to use it:

```bash
markwell install-skills          # project-level (.claude/commands/)
markwell install-skills --global # global (~/.claude/commands/)
```

This copies a skill file that teaches Claude Code the available commands, formats, and options.

## Quick Start

### Reading Documents (Ingest)

Convert any supported file to Markdown:

```bash
markwell convert report.docx            # → report.md
markwell convert financials.xlsx        # → financials/ (one CSV per sheet)
markwell convert deck.pptx              # → deck.md
markwell convert meeting.vtt            # → meeting.md
markwell convert page.html              # → page.md
markwell convert data.json              # → data.md
```

### Creating Documents (Export)

Convert Markdown into styled output using format aliases:

```bash
markwell convert draft.md --to docx                      # → draft.docx
markwell convert draft.md --to word                      # → draft.docx (alias)
markwell convert data.csv --to xlsx                      # → data.xlsx
markwell convert data.csv --to excel                     # → data.xlsx (alias)
markwell convert slides.md --to pptx                     # → slides.pptx
markwell convert slides.md --to powerpoint               # → slides.pptx (alias)
markwell convert slides.md --to html                     # → slides.html
markwell convert slides.md --to pdf                      # → slides.pdf
markwell convert transcript.md --to vtt                  # → transcript.vtt
markwell convert transcript.md --to srt                  # → transcript.srt
markwell convert draft.md --to docx,pdf                  # → draft.docx + draft.pdf
```

### Batch Processing

Use glob patterns to convert multiple files at once:

```bash
markwell convert "docs/*.docx"                           # all Word files
markwell convert "**/*.html" -o output/                  # recursive, custom output dir
markwell convert "reports/*.md" --to docx --force          # overwrite without prompting
```

## Supported Formats

### Ingest (read)

| Category     | Extensions                        |
| ------------ | --------------------------------- |
| Document     | `.docx`, `.doc`                   |
| Spreadsheet  | `.xlsx`, `.xls`, `.xlsm`         |
| Presentation | `.pptx`, `.ppt`                   |
| Transcript   | `.vtt`, `.srt`                    |
| Web          | `.html`, `.htm`                   |
| Rich Text    | `.rtf`                            |
| Data         | `.json`, `.jsonl`, `.jsonc`      |
| Drawing      | `.excalidraw`                     |
| Slides (MD)  | `.md` (Marp format)               |

### Export (create)

| Category     | Extensions                   | Aliases                                     |
| ------------ | ---------------------------- | ------------------------------------------- |
| Document     | `.docx`, `.html`, `.pdf`*   | `word`, `doc`, `docx`                       |
| Spreadsheet  | `.xlsx`                      | `excel`, `xlsx`, `xls`, `sheets`            |
| Presentation | `.html`, `.pptx`, `.pdf`    | `powerpoint`, `slides`, `pptx`, `ppt`       |
| Transcript   | `.vtt`, `.srt`              | `vtt`, `srt`, `transcription`               |

## CLI Reference

### `markwell convert <file-or-glob>`

The primary command. Converts files to or from Markdown.

```
Options:
  --to <format>               Export format(s): docx, pptx, pdf, xlsx, vtt, srt, etc.
  -o, --output <path>         Output file or directory
  --theme <name|path>         Theme name or path to .markwell.yaml
  --force                     Overwrite existing files without prompting
  --dry-run                   Show what would happen without writing
  --verbose                   Show detailed processing info
```

When `--to` is omitted, Markwell ingests the file into Markdown. When `--to` is provided, it exports Markdown to the specified format. You can use format aliases like `powerpoint`, `word`, or `excel`, and comma-separated values for multi-format output (e.g., `--to docx,pdf`).

The `--dry-run` flag is useful for previewing what an agent would do before committing to file writes.

### `markwell converters list`

Show all registered ingest and export converters with their supported extensions and formats.

### `markwell converters info <name>`

Show details about a specific converter (e.g., `markwell converters info docx`).

### `markwell themes list`

List all available themes — both built-in and any `.markwell.yaml` found in the directory tree.

### `markwell themes preview <name>`

Display a fully resolved theme with all settings — colors, typography, spacing, and format-specific options.

### `markwell themes init`

Create a starter `.markwell.yaml` in the current directory. Use `--force` to overwrite an existing file.

### `markwell install-skills [--global]`

Copy the Claude Code skill file to `.claude/commands/markwell.md`. With `--global`, installs to `~/.claude/commands/` instead.

## Themes

Themes control the visual styling of exported documents. Four built-in themes are included:

| Theme            | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| `default`      | Clean, minimal styling — Calibri 11pt, standard margins    |
| `professional` | Corporate/consulting — darker palette, wider margins       |
| `modern`       | Contemporary — bolder accent colors, Segoe UI font         |
| `minimal`      | Stripped down — content-focused, fewer decorative elements |

### Using Themes

```bash
# Apply a built-in theme
markwell convert report.md --to docx --theme professional

# Apply a custom theme file
markwell convert report.md --to docx --theme ./brand.markwell.yaml
```

### Automatic Theme Discovery

If you place a `.markwell.yaml` file in your project, Markwell finds it automatically by walking up the directory tree from the input file. No `--theme` flag needed.

```bash
# Create a project theme
markwell themes init

# Edit .markwell.yaml to customize, then convert — theme applies automatically
markwell convert report.md --to docx
```

### Custom Themes

A `.markwell.yaml` file extends a base theme and overrides specific settings:

```yaml
extends: professional

colors:
  primary: "1A4F8B"
  accent: "E8491D"

typography:
  fontFamily: Georgia

document:
  header: "{title}"
  footer: "Page {page} of {pages}"
  margins:
    left: 1800
    right: 1800

spreadsheet:
  headerBackground: "$primary"
  headerBold: true

presentation:
  footer: "Confidential"
  paginate: true
```

Color variables like `$primary` and `$accent` reference values from the `colors` section and are substituted automatically.

### Theme Sections

| Section          | Controls                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `colors`       | Primary, accent, text, background, muted (hex values)                                          |
| `typography`   | Font family, body size, heading sizes, code font                                               |
| `spacing`      | Paragraph spacing, heading spacing (before/after)                                              |
| `document`     | Margins, headers, footers (with `{title}`, `{page}`, `{pages}`, `{date}` placeholders) |
| `spreadsheet`  | Header row background, text color, bold                                                        |
| `presentation` | Theme name, pagination, background color, header/footer, custom CSS                            |
| `transcript`   | Speaker label inclusion                                                                        |

### Theme Inheritance

Themes can chain: your theme extends `professional`, which extends `default`. Each layer deep-merges — objects merge recursively, primitives replace. Circular inheritance is detected and rejected.

---

## Developer Guide

### Getting Started

```bash
git clone <repo-url>
cd markwell
npm install
npm run build        # compile TypeScript + copy themes/skills to dist
npm test             # run all 184 tests
npm run lint         # ESLint
npm run typecheck    # TypeScript strict mode check
```

The build step runs `tsdown` to bundle the CLI entry point, then copies `src/themes/` and `src/skills/` to `dist/` (these are runtime assets that must be accessible from the compiled output).

### Project Structure

```
src/
├── cli/
│   ├── index.ts              # CLI entry point (commander setup)
│   ├── setup-registry.ts     # Converter registration
│   └── commands/
│       ├── convert.ts        # convert command (ingest + export logic)
│       ├── converters.ts     # converters list/info commands
│       ├── themes.ts         # themes list/preview/init commands
│       └── install-skills.ts # install-skills command
├── core/
│   ├── types.ts              # Shared interfaces
│   ├── registry.ts           # ConverterRegistry class
│   ├── theme-schema.ts       # Theme types and defaults
│   └── theme-loader.ts       # Theme resolution, inheritance, variable substitution
├── ingest/                   # One file per ingest converter
├── export/                   # One file per export converter
│   └── utils/
│       └── markdown-parser.ts  # Shared unified/remark AST parser
├── themes/                   # Built-in theme YAML files
└── skills/                   # Claude Code skill template
tests/
├── fixtures/                 # Sample files for testing
└── integration/              # CLI e2e, round-trip, registry, startup tests
```

### How Converters Work

Markwell uses a **registry pattern** with two-stage resolution for ingest and category-based resolution for export.

#### Ingest Converters

An ingest converter transforms a source file into Markdown:

```typescript
interface IngestConverter {
  name: string;                                     // e.g., "docx"
  extensions: string[];                             // e.g., [".docx", ".doc"]
  canProcess(input: CanProcessInput): Promise<boolean>;
  ingest(input: IngestInput): Promise<IngestOutput>;
}
```

**Resolution** works in two stages:

1. **Extension filter** — narrow to converters whose `extensions` array matches the input file
2. **Content inspection** — call `canProcess()` on each match (in registration order) with the first 1KB of file content

This allows smart detection — for example, `.json` files are checked for Excalidraw schema before falling back to the generic JSON converter.

**Output** is either a single Markdown string (`markdown`) or multiple files (`files` — used by xlsx for one CSV per sheet), plus optional binary `assets` and `metadata`.

#### Export Converters

An export converter transforms Markdown (or CSV) into a styled output format:

```typescript
interface ExportConverter {
  name: string;                                     // e.g., "document"
  category: ExportCategory;                         // "document" | "spreadsheet" | "presentation" | "transcript"
  formats: ExportFormat[];                          // Supported output formats
  export(input: ExportInput): Promise<ExportOutput>;
}
```

**Resolution** matches by category, then validates the requested format against the converter's `formats` array.

The `ExportInput` includes the resolved theme, so converters apply styling without needing to know about theme loading.

#### Adding a New Converter

1. Create `src/ingest/myformat.ts` (or `src/export/myformat.ts`)
2. Implement the `IngestConverter` or `ExportConverter` interface
3. Register it in `src/cli/setup-registry.ts` — order matters for ingest (specific before generic)
4. Add tests alongside (e.g., `src/ingest/myformat.test.ts`)
5. Add test fixtures to `tests/fixtures/`

#### Lazy Loading

Heavy dependencies (mammoth, exceljs, docx, marp-core) are loaded via dynamic `import()` inside converter functions. This keeps CLI startup fast — the 62KB bundle loads instantly, and heavy libraries are only pulled in when a specific converter is used.

### The Style API

Export converters receive a fully resolved `ResolvedTheme` object. Here's how each export uses it:

#### Document Export (DOCX)

The document exporter walks the Markdown AST (via unified/remark-parse/remark-gfm) and maps nodes to `docx` package elements:

```typescript
// Theme values used:
theme.typography.fontFamily    // → font for all text runs
theme.typography.bodySize      // → body text size (half-points)
theme.typography.headingSizes  // → { 1: 48, 2: 40, ... } per heading level
theme.typography.codeFont      // → font for code blocks/inline code
theme.colors.primary           // → heading text color
theme.colors.text              // → body text color
theme.colors.accent            // → table header background, link color
theme.spacing.paragraphAfter   // → paragraph spacing (twips)
theme.spacing.headingBefore    // → space before headings
theme.spacing.headingAfter     // → space after headings
theme.document.margins         // → { top, bottom, left, right } in twips
theme.document.header          // → header text (supports {title}, {page}, {pages}, {date})
theme.document.footer          // → footer text
```

#### Spreadsheet Export (XLSX)

Parses CSV/TSV input and creates ExcelJS workbooks:

```typescript
theme.spreadsheet.headerBackground  // → header row fill color (supports $variable)
theme.spreadsheet.headerTextColor   // → header row font color
theme.spreadsheet.headerBold        // → bold header row
```

#### Presentation Export (HTML/PPTX/PDF)

Injects theme settings as Marp frontmatter directives and custom CSS:

```typescript
theme.presentation.theme            // → Marp theme name
theme.presentation.paginate         // → slide numbering
theme.presentation.backgroundColor  // → slide background
theme.presentation.header           // → slide header
theme.presentation.footer           // → slide footer
theme.presentation.style            // → custom CSS injected into output
theme.colors.primary                // → heading color via CSS
theme.typography.fontFamily         // → font-family via CSS
```

#### Transcript Export (VTT/SRT)

Parses the shared transcript Markdown format and reconstructs subtitle files:

```typescript
theme.transcript.speakerLabels      // → include speaker labels in VTT output
```

### Testing

Tests live alongside source files (`*.test.ts`) and in `tests/integration/`:

```bash
npm test                             # run all tests
npm run test:watch                   # watch mode
npx vitest run src/ingest/           # run only ingest tests
npx vitest run tests/integration/    # run only integration tests
```

**Note:** First-run tests for converters that lazy-load heavy dependencies may need extended timeouts (15-30s) due to cold-start module loading in dev containers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure `npm run lint`, `npm run typecheck`, and `npm test` all pass
5. Submit a pull request

### CI/CD

- **CI** runs on every push to `main` and on PRs: lint, typecheck, test (with coverage), and build across Node.js 18 and 20
- **Release** triggers on `v*` tags and publishes to npm with provenance

## License

MIT

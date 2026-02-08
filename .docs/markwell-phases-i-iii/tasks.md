# Markwell (Phases I–III) — Implementation Tasks

## Overview

Markwell is a CLI tool that converts documents to and from Markdown. Markdown (and CSV for tabular data) is the universal interchange format — the "hub" through which all documents flow. This task list covers Phases I through III: Ingest converters, Export converters, and the Theme system. The codebase is greenfield — no source code exists yet beyond a placeholder `index.js`.

## Tasks

### [x] 0100 - Project Scaffolding and Build Infrastructure

**Overview:** Initialize the TypeScript project from scratch. Set up the package.json with scripts, ESM configuration, and bin entry. Configure TypeScript (strict mode), tsdown for building, Vitest for testing, and ESLint for linting. Create the directory structure outlined in the PRD. This is the foundation everything else depends on.

**Relevant Files:**
- `package.json` - Scripts (`build`, `test`, `lint`, `dev`), `bin` entry, `engines`, `type: "module"`, dependencies
- `tsconfig.json` - TypeScript strict mode, ESM target, path aliases
- `tsdown.config.ts` - tsdown build configuration
- `vitest.config.ts` - Vitest test runner configuration
- `eslint.config.js` - ESLint flat config for TypeScript
- `src/cli/index.ts` - CLI entry point stub with shebang (`#!/usr/bin/env node`)
- `src/core/types.ts` - Shared TypeScript interfaces (stub)

**Sub-Tasks:**
- [x] 0101 Initialize `package.json` with `name: "markwell"`, `version: "0.1.0"`, `type: "module"`, `engines: { node: ">=18" }`, `bin: { markwell: "./dist/cli/index.js" }`, and `files` array. Add dev dependencies: `typescript`, `tsdown`, `vitest`, `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`. Add scripts: `build`, `dev`, `test`, `lint`, `typecheck`.
- [x] 0102 Create `tsconfig.json` with `strict: true`, `target: "ES2022"`, `module: "Node16"`, `moduleResolution: "Node16"`, `outDir: "./dist"`, `rootDir: "./src"`, `declaration: true`, and `esModuleInterop: true`.
- [x] 0103 Create `tsdown.config.ts` that compiles `src/**/*.ts` to `dist/` as ESM. Ensure the CLI entry point retains its shebang line after bundling.
- [x] 0104 Create `vitest.config.ts` with TypeScript support and coverage reporting enabled.
- [x] 0105 Create `eslint.config.js` (flat config format) for TypeScript with recommended rules.
- [x] 0106 Create the full directory structure: `src/cli/commands/`, `src/core/`, `src/ingest/`, `src/export/`, `src/themes/`, `src/skills/`, `tests/fixtures/`.
- [x] 0107 Create `src/cli/index.ts` as a minimal CLI entry point with `#!/usr/bin/env node` shebang, importing `commander` and registering a placeholder `--version` and `--help`.
- [x] 0108 Verify the full pipeline works: `npm run build` compiles to `dist/`, `node dist/cli/index.js --help` prints help, `npm test` runs (even with zero tests), `npm run lint` passes.

**Notes:**
- The existing `index.js` placeholder can be removed once the real build output is in place.
- The `nul` file in the repo root appears to be a leftover and can be removed.
- Node.js 18+ is the minimum; ESM only (no CJS dual output).

---

### [x] 0200 - Core Types and Converter Registry

**Overview:** Define the shared TypeScript interfaces (`IngestConverter`, `ExportConverter`, `OutputFile`, `CanProcessInput`, `IngestInput`, `IngestOutput`, `ExportInput`, `ExportOutput`, `ExportCategory`, `ExportFormat`) and implement the `ConverterRegistry` class. The registry handles two-stage ingest resolution (extension filtering → `canProcess` content inspection) and category-based export resolution.

**Relevant Files:**
- `src/core/types.ts` - All shared interfaces and type definitions
- `src/core/registry.ts` - `ConverterRegistry` class implementation
- `src/core/registry.test.ts` - Unit tests for the registry

**Sub-Tasks:**
- [x] 0201 Define all ingest-related interfaces in `src/core/types.ts`: `OutputFile`, `CanProcessInput`, `IngestInput`, `IngestOutput`, and `IngestConverter` (with `name`, `extensions`, `canProcess`, `ingest` methods).
- [x] 0202 Define all export-related interfaces in `src/core/types.ts`: `ExportCategory` type union, `ExportFormat`, `ExportInput`, `ExportOutput`, and `ExportConverter` (with `name`, `category`, `formats`, `export` methods).
- [x] 0203 Implement `ConverterRegistry` class in `src/core/registry.ts` with `registerIngest()`, `registerExport()`, `listIngest()`, `listExport()` methods.
- [x] 0204 Implement `resolveIngest(filePath, buffer)` on the registry: filter by extension match, then call `canProcess()` on each match in registration order, return the first that returns `true`.
- [x] 0205 Implement `resolveExport(category, format?)` on the registry: find the export converter for the given category, validate the format is supported if provided, return `null` if not found.
- [x] 0206 Write unit tests for the registry: test extension filtering, `canProcess` ordering (specific before generic), export category resolution, and edge cases (no match, multiple matches, unknown format).
- [x] 0207 Create a `src/core/index.ts` barrel file that re-exports the registry and types.

**Notes:**
- Registration order matters — specific converters (Excalidraw, MARP) must be registered before generic ones (JSON, Markdown).
- This task has no external dependencies — all pure TypeScript.
- The `CanProcessInput.head` field should be the first ~1KB of the file decoded as UTF-8 for quick text inspection.

---

### [x] 0300 - CLI Framework and Convert Command

**Overview:** Wire up the CLI using `commander`. Implement the `convert` command with glob support (`fast-glob`), the `--to` flag with `category:format` parsing, `-o` output path, `--force`, `--dry-run`, `--verbose`, `--theme`, and the overwrite-prompt behavior. Implement the `converters list` and `converters info` subcommands. Handle batch processing with continue-on-error and summary output.

**Relevant Files:**
- `src/cli/index.ts` - Commander program setup, register all commands
- `src/cli/commands/convert.ts` - Convert command: glob expansion, ingest vs export routing, output path resolution, overwrite prompts, dry-run, verbose logging, batch error handling
- `src/cli/commands/converters.ts` - `converters list` and `converters info` commands
- `src/cli/commands/convert.test.ts` - Unit tests for convert command logic (path resolution, `--to` parsing, dry-run output)
- `src/cli/commands/converters.test.ts` - Unit tests for converters commands
- `src/core/logger.ts` - Simple logger utility that respects `--verbose` flag

**Sub-Tasks:**
- [x] 0301 Create `src/core/logger.ts` — a simple logger with methods like `info()`, `verbose()`, `error()`, `warn()`. The `verbose()` method should only output when `--verbose` is enabled. Store verbose state as a module-level flag.
- [x] 0302 Implement the main CLI program in `src/cli/index.ts` using `commander`: register `--version` (from package.json), `--help`, and subcommands (`convert`, `converters`, `themes`, `install-skills` — themes and install-skills as stubs for now).
- [x] 0303 Implement `--to` flag parsing in a utility function: parse `"document"` → `{ category: "document", formats: [] }`, `"document:pdf"` → `{ category: "document", formats: ["pdf"] }`, `"document:docx,pdf"` → `{ category: "document", formats: ["docx", "pdf"] }`. Validate category is one of the four allowed values.
- [x] 0304 Implement output path resolution: given an input file path, an output extension, and an optional `-o` flag value, compute the output file path. Handle `-o` as a directory (append filename with new extension) or as a specific file path.
- [x] 0305 Implement overwrite prompt logic: check if output file exists, if `--force` is not set and stdin is a TTY, prompt `"<file> already exists. Overwrite? [y/N]"`. In non-TTY environments, refuse with an error suggesting `--force`.
- [x] 0306 Implement the convert command handler in `src/cli/commands/convert.ts`: accept file-or-glob argument, expand globs via `fast-glob`, read each file into a buffer, resolve the appropriate converter (ingest or export based on `--to`), run the conversion, write output. Loop through all files, catch errors per file, continue processing, and print a summary at the end.
- [x] 0307 Implement `--dry-run` mode: when set, run through all the same logic (glob expansion, converter resolution, output path computation) but prefix output with `[DRY RUN]` and skip actual file writes.
- [x] 0308 Implement `--verbose` mode: log which converter was selected for each file, processing duration (using `performance.now()`), and any intermediate steps.
- [x] 0309 Implement `converters list` command in `src/cli/commands/converters.ts`: display all registered ingest converters (name, extensions) and export converters (name, category, formats) in a formatted table.
- [x] 0310 Implement `converters info <name>` command: look up a converter by name and display its details (extensions or formats, category, description).
- [x] 0311 Create a `src/cli/setup-registry.ts` file that instantiates a `ConverterRegistry`, registers all ingest and export converters in the correct order (specific before generic), and exports the configured registry instance. For now, register placeholder/stub converters that will be replaced in tasks 0400–0600 and 0700–1000.
- [x] 0312 Write unit tests for: `--to` flag parsing, output path resolution, overwrite prompt logic (mock stdin), dry-run output, batch error summary.

**Notes:**
- Without `--force`, prompt for overwrite confirmation; in non-TTY environments, refuse and suggest `--force`.
- Glob processing uses `fast-glob` and continues on failure with a summary at the end.
- The convert command auto-detects ingest vs export based on presence of `--to`.
- The `--theme` flag is parsed here but actual theme resolution is implemented in task 1100.

---

### [ ] 0400 - Ingest Converters: DOCX, XLSX, PPTX (Office Formats)

**Overview:** Implement the three Office format ingest converters. DOCX uses `mammoth` to produce Markdown. XLSX uses `exceljs` to produce a directory of CSV files (one per sheet). PPTX uses `markitdown` to convert slides to Markdown. All three use OOXML zip signature detection in `canProcess`.

**Relevant Files:**
- `src/ingest/docx.ts` - DOCX/DOC ingest converter
- `src/ingest/xlsx.ts` - XLSX/XLS/XLSM ingest converter
- `src/ingest/pptx.ts` - PPTX/PPT ingest converter
- `src/ingest/docx.test.ts` - Tests with fixture .docx files
- `src/ingest/xlsx.test.ts` - Tests with fixture .xlsx files
- `src/ingest/pptx.test.ts` - Tests with fixture .pptx files
- `tests/fixtures/` - Sample Office documents for testing

**Sub-Tasks:**
- [x] 0401 Create a shared OOXML detection utility (`src/ingest/utils/ooxml.ts`) that checks the first 4 bytes of a buffer for the PK zip signature (`0x504B0304`). Provide helper functions like `isOoxmlZip(buffer)`, `hasZipEntry(buffer, entryPattern)` for checking specific entries (e.g., `word/document.xml`, `xl/workbook.xml`, `ppt/presentation.xml`).
- [x] 0402 Implement the DOCX ingest converter in `src/ingest/docx.ts`: `name: "docx"`, `extensions: [".docx", ".doc"]`, `canProcess` checks for OOXML zip + `word/document.xml` entry. The `ingest` method lazy-loads `mammoth`, calls `mammoth.convertToMarkdown(buffer)`, and returns the markdown. Extract images to the `assets` map.
- [x] 0403 Create sample `.docx` test fixture (`tests/fixtures/sample.docx`) with headings, bold/italic, a bulleted list, a table, and a link. Write unit tests verifying the ingest output contains the expected Markdown elements.
- [x] 0404 Implement the XLSX ingest converter in `src/ingest/xlsx.ts`: `name: "xlsx"`, `extensions: [".xlsx", ".xls", ".xlsm"]`, `canProcess` checks for OOXML zip + `xl/workbook.xml`. The `ingest` method lazy-loads `exceljs`, iterates over worksheets, converts each sheet to CSV, and returns `files` array with `relativePath` set to sanitized sheet name + `.csv`.
- [x] 0405 Implement sheet name sanitization: replace characters invalid for filenames (`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) with underscores. Trim whitespace. Handle duplicate names by appending a numeric suffix.
- [x] 0406 Create sample `.xlsx` test fixture (`tests/fixtures/sample.xlsx`) with at least 2 sheets, numeric data, text, and an empty sheet. Write tests verifying correct CSV output per sheet and sanitized filenames.
- [x] 0407 Implement the PPTX ingest converter in `src/ingest/pptx.ts`: `name: "pptx"`, `extensions: [".pptx", ".ppt"]`, `canProcess` checks for OOXML zip + `ppt/presentation.xml`. The `ingest` method lazy-loads `markitdown` and converts the presentation to Markdown.
- [x] 0408 Create sample `.pptx` test fixture (`tests/fixtures/sample.pptx`) with a title slide, a content slide with bullet points, and a slide with speaker notes. Write tests verifying slide content appears as Markdown sections and speaker notes are included.
- [x] 0409 Register all three converters in `src/cli/setup-registry.ts` (replacing any stubs), verify `converters list` displays them.

**Notes:**
- All heavy dependencies (`mammoth`, `exceljs`, `markitdown`) must be lazy-loaded via dynamic `import()`.
- XLSX output: each sheet becomes a separate CSV file; the directory name matches the input file name (without extension).
- Images extracted during DOCX ingest should be stored in the `assets` Map on `IngestOutput`, keyed by relative path.
- Install `mammoth`, `exceljs`, and `markitdown` as regular dependencies in `package.json`.

---

### [ ] 0500 - Ingest Converters: VTT, SRT, HTML, RTF (Text-Based Formats)

**Overview:** Implement ingest converters for text-based formats. VTT and SRT parse timestamped transcripts into a shared Markdown structure (timestamps + text). HTML uses `turndown` for conversion. RTF uses an RTF parser for basic formatting preservation.

**Relevant Files:**
- `src/ingest/vtt.ts` - WebVTT ingest converter
- `src/ingest/srt.ts` - SubRip ingest converter
- `src/ingest/html.ts` - HTML ingest converter
- `src/ingest/rtf.ts` - RTF ingest converter
- `src/ingest/vtt.test.ts` - Tests for VTT ingest
- `src/ingest/srt.test.ts` - Tests for SRT ingest
- `src/ingest/html.test.ts` - Tests for HTML ingest
- `src/ingest/rtf.test.ts` - Tests for RTF ingest
- `tests/fixtures/` - Sample text-format files for testing

**Sub-Tasks:**
- [ ] 0501 Define the shared transcript Markdown format. Design the Markdown structure that both VTT and SRT will produce — e.g., each cue as a block with timestamp line and text line. Document this format in a comment at the top of `src/ingest/vtt.ts` so the export transcript converter (task 1000) can parse it back. Example format:
  ```
  ## Transcript

  **[00:00:01.000 --> 00:00:04.500]** Speaker Name
  This is what was said during this time segment.

  **[00:00:05.000 --> 00:00:08.200]**
  Another segment without a speaker label.
  ```
- [ ] 0502 Implement the VTT ingest converter in `src/ingest/vtt.ts`: `name: "vtt"`, `extensions: [".vtt"]`, `canProcess` validates the `WEBVTT` header in the first line. The `ingest` method parses cues (timestamp lines, text lines, speaker labels from `<v>` tags) and produces the shared transcript Markdown format.
- [ ] 0503 Create sample `.vtt` test fixture (`tests/fixtures/sample.vtt`) with multiple cues, speaker labels (`<v>` tags), and multi-line cue text. Write tests verifying correct Markdown output with timestamps and speaker labels.
- [ ] 0504 Implement the SRT ingest converter in `src/ingest/srt.ts`: `name: "srt"`, `extensions: [".srt"]`, `canProcess` validates the SRT format (starts with sequential number, followed by timestamp line with `-->`, then text). The `ingest` method parses cues and produces the same shared Markdown format as VTT, but without speaker labels.
- [ ] 0505 Create sample `.srt` test fixture (`tests/fixtures/sample.srt`) with multiple cues and multi-line text. Write tests verifying correct Markdown output matching the shared transcript format.
- [ ] 0506 Implement the HTML ingest converter in `src/ingest/html.ts`: `name: "html"`, `extensions: [".html", ".htm"]`, `canProcess` returns `true` for any file with these extensions (no content inspection needed — extension is sufficient). The `ingest` method lazy-loads `turndown` and converts the HTML to Markdown. Configure Turndown to preserve headings, links, lists, tables, images, bold, and italic.
- [ ] 0507 Create sample `.html` test fixture (`tests/fixtures/sample.html`) with headings, paragraphs, a list, a table, a link, an image, and bold/italic text. Write tests verifying the Markdown output preserves all these elements.
- [ ] 0508 Implement the RTF ingest converter in `src/ingest/rtf.ts`: `name: "rtf"`, `extensions: [".rtf"]`, `canProcess` checks for the `{\rtf` header in the first bytes. The `ingest` method lazy-loads an RTF parser and converts to Markdown, preserving bold, italic, headings, and lists.
- [ ] 0509 Create sample `.rtf` test fixture (`tests/fixtures/sample.rtf`) with basic formatting. Write tests verifying the Markdown output.
- [ ] 0510 Register all four converters in `src/cli/setup-registry.ts`, verify `converters list` displays them.

**Notes:**
- VTT and SRT must produce the same Markdown structure so the transcript export converter (task 1000) only needs to parse one format.
- SRT does not natively support speaker labels, so the SRT converter omits them.
- `turndown` and the RTF parser are lazy-loaded via dynamic `import()`.
- Install `turndown` and the chosen RTF parser as regular dependencies in `package.json`.

---

### [ ] 0600 - Ingest Converters: JSON, Excalidraw, MARP (Smart Detection)

**Overview:** Implement converters that share file extensions and rely on content inspection to differentiate. Excalidraw detects `"type": "excalidraw"` in JSON. MARP detects `marp: true` frontmatter in `.md` files. Generic JSON produces schema outlines. Registration order ensures specific converters are checked before generic ones.

**Relevant Files:**
- `src/ingest/json.ts` - Generic JSON/JSONL/JSONC ingest converter
- `src/ingest/excalidraw.ts` - Excalidraw ingest converter
- `src/ingest/marp.ts` - MARP presentation ingest converter
- `src/ingest/json.test.ts` - Tests for JSON ingest
- `src/ingest/excalidraw.test.ts` - Tests for Excalidraw ingest
- `src/ingest/marp.test.ts` - Tests for MARP ingest
- `tests/fixtures/` - Sample JSON, Excalidraw, and MARP files

**Sub-Tasks:**
- [ ] 0601 Implement the Excalidraw ingest converter in `src/ingest/excalidraw.ts`: `name: "excalidraw"`, `extensions: [".excalidraw", ".json"]`, `canProcess` parses the file as JSON and checks for `"type": "excalidraw"` at the top level. The `ingest` method extracts all text elements (labels, text content) and produces Markdown listing the drawing's text content. No Mermaid diagram generation (deferred to Phase IV).
- [ ] 0602 Create sample Excalidraw test fixture (`tests/fixtures/sample.excalidraw`) with text elements, rectangles with labels, and arrows. Write tests verifying the converter detects the Excalidraw schema and extracts text content to Markdown.
- [ ] 0603 Implement the MARP ingest converter in `src/ingest/marp.ts`: `name: "marp"`, `extensions: [".md", ".markdown"]`, `canProcess` checks for `marp: true` in the YAML frontmatter (parse the first `---` block). The `ingest` method passes the content through as Markdown, optionally stripping MARP-specific frontmatter fields.
- [ ] 0604 Create sample MARP test fixture (`tests/fixtures/sample-marp.md`) with `marp: true` frontmatter and slide separators (`---`). Write tests verifying `canProcess` returns `true` for MARP files and `false` for regular Markdown.
- [ ] 0605 Implement the generic JSON ingest converter in `src/ingest/json.ts`: `name: "json"`, `extensions: [".json", ".jsonl", ".jsonc"]`, `canProcess` confirms the file contains valid JSON (or JSONL/JSONC). The `ingest` method produces Markdown with a schema outline (listing top-level keys and their types) and, for arrays of objects, a Markdown table summarizing the data.
- [ ] 0606 Handle JSONL: detect line-delimited JSON, parse each line, and produce a summary (number of records, common keys).
- [ ] 0607 Handle JSONC: strip comments (`//` and `/* */`) before parsing.
- [ ] 0608 Create sample JSON test fixtures: `tests/fixtures/sample.json` (object with nested keys), `tests/fixtures/sample.jsonl` (line-delimited), and a regular `package.json`-style file. Write tests verifying schema outlines and tabular output.
- [ ] 0609 Test conflict resolution: verify that an Excalidraw `.json` file is handled by the Excalidraw converter (not the generic JSON converter), and that a regular `.json` file falls through to the generic JSON converter.
- [ ] 0610 Test conflict resolution for MARP: verify that a `.md` file with `marp: true` is handled by the MARP converter, and a regular `.md` file is not processed by any ingest converter (it's already Markdown).
- [ ] 0611 Update `src/cli/setup-registry.ts` to register converters in the correct order: Excalidraw before JSON, MARP before any generic Markdown handling.

**Notes:**
- Excalidraw-to-Mermaid conversion is deferred to Phase IV. For now, just extract text.
- The generic JSON converter is the fallback — it must be registered AFTER Excalidraw.
- MARP must be registered BEFORE any generic Markdown pass-through.
- JSONC comment stripping should handle both `//` line comments and `/* */` block comments.

---

### [ ] 0700 - Export Converter: Document (Markdown to DOCX)

**Overview:** Implement the document export converter. Parse Markdown into an AST (via `unified`/`remark`), map AST nodes to `docx` npm package elements, and produce a styled `.docx` file. Apply theme styles for typography, colors, spacing, page layout, headers/footers, and table formatting. Handle embedded images from the `assets/` directory. Document PDF export is deferred.

**Relevant Files:**
- `src/export/document.ts` - Document export converter
- `src/export/document.test.ts` - Tests for DOCX export
- `tests/fixtures/` - Sample Markdown files for export testing

**Sub-Tasks:**
- [ ] 0701 Set up Markdown-to-AST parsing utility (`src/export/utils/markdown-parser.ts`): lazy-load `unified`, `remark-parse`, and `remark-gfm` (for tables). Provide a function `parseMarkdown(content: string)` that returns an mdast tree.
- [ ] 0702 Implement the document export converter skeleton in `src/export/document.ts`: `name: "document"`, `category: "document"`, `formats: [{ extension: ".docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word Document" }]`.
- [ ] 0703 Implement the AST-to-DOCX mapping: walk the mdast tree and convert nodes to `docx` package elements. Map `heading` → `Paragraph` with heading style, `paragraph` → `Paragraph`, `strong` → bold `TextRun`, `emphasis` → italic `TextRun`, `link` → `ExternalHyperlink`, `code` → `TextRun` with code font, `list` → numbered/bulleted paragraphs, `blockquote` → indented paragraph with border styling.
- [ ] 0704 Implement table rendering: convert mdast `table` nodes to `docx` `Table` elements with header row styling from the theme (background color, bold text, text color).
- [ ] 0705 Implement theme application: read the `ResolvedTheme` from `ExportInput.theme` and apply typography (font family, size, color for headings and body), spacing (paragraph after, heading before/after), page layout (page size, margins), and header/footer text (with `{page}`, `{pages}`, `{title}`, `{date}` variable substitution).
- [ ] 0706 Implement image embedding: scan the mdast tree for `image` nodes, resolve their `src` paths relative to the input file's `assets/` directory (or from the `ExportInput.assets` map), and embed them in the DOCX as inline images.
- [ ] 0707 Implement Mermaid rendering: detect `code` nodes with `lang: "mermaid"`, lazy-load `@mermaid-js/mermaid-cli`, render the Mermaid code to SVG/PNG, and embed the resulting image in the DOCX.
- [ ] 0708 Write unit tests: create a sample Markdown file with headings, paragraphs, bold/italic, a list, a table, a link, and an image reference. Export to DOCX buffer and verify (by parsing the DOCX zip) that the expected elements are present.
- [ ] 0709 Register the document export converter in `src/cli/setup-registry.ts`.

**Notes:**
- Lazy-load `docx`, `unified`, `remark-parse`, `remark-gfm`, and `@mermaid-js/mermaid-cli`.
- Document PDF export is deferred — only `.docx` output in Phases I–III.
- The `docx` npm package API uses a builder pattern — construct `Document` → `Section` → `Paragraph` → `TextRun`.
- Theme values with `$variable` references should already be resolved by the theme loader (task 1100) before reaching the export converter.

---

### [ ] 0800 - Export Converter: Spreadsheet (CSV to XLSX)

**Overview:** Implement the spreadsheet export converter. Read one or more CSV/TSV files, create an Excel workbook with one sheet per file using `exceljs`, apply theme styles (header row formatting, column widths, number formatting), and output as `.xlsx`.

**Relevant Files:**
- `src/export/spreadsheet.ts` - Spreadsheet export converter
- `src/export/spreadsheet.test.ts` - Tests for XLSX export
- `tests/fixtures/` - Sample CSV/TSV files for testing

**Sub-Tasks:**
- [ ] 0801 Implement the spreadsheet export converter skeleton in `src/export/spreadsheet.ts`: `name: "spreadsheet"`, `category: "spreadsheet"`, `formats: [{ extension: ".xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel Spreadsheet" }]`.
- [ ] 0802 Implement CSV parsing: parse each input file's content as CSV (handle commas, quoted fields, newlines within quotes). Use a lightweight CSV parser or write a simple one. Detect TSV (tab-separated) by checking for tabs in the first line.
- [ ] 0803 Implement workbook creation: lazy-load `exceljs`, create a new `Workbook`, and for each input file, add a `Worksheet`. Infer sheet names from the input file's `relativePath` (strip extension, sanitize for Excel sheet name rules: max 31 chars, no special characters).
- [ ] 0804 Implement data population: write parsed CSV rows into the worksheet. Attempt to auto-detect numeric values and format them as numbers rather than strings.
- [ ] 0805 Implement theme application: apply header row styling (bold, background color, text color, freeze panes) from the theme's `spreadsheet` section. Apply auto-column-width or default column width. Apply number format from theme.
- [ ] 0806 Write the workbook to a buffer (`workbook.xlsx.writeBuffer()`) and return it as `ExportOutput`.
- [ ] 0807 Write unit tests: create sample CSV fixtures (single file, multiple files, TSV, file with special characters and quoted fields). Export to XLSX buffer and verify sheet count, sheet names, header styling, and data content by reading the buffer back with `exceljs`.
- [ ] 0808 Register the spreadsheet export converter in `src/cli/setup-registry.ts`.

**Notes:**
- Lazy-load `exceljs`.
- When the convert command receives multiple CSV files (from a glob or directory), they should all be passed as `ExportInput.files` and combined into one workbook.
- Excel sheet names have a 31-character limit and cannot contain `[]:*?/\` characters.

---

### [ ] 0900 - Export Converter: Presentation (Markdown to PPTX/HTML/PDF via MARP)

**Overview:** Implement the presentation export converter using MARP (`@marp-team/marp-cli`). Convert Markdown to `.pptx`, `.html`, and `.pdf`. Apply theme settings for slide styling, pagination, and custom CSS. MARP is a regular dependency.

**Relevant Files:**
- `src/export/presentation.ts` - Presentation export converter
- `src/export/presentation.test.ts` - Tests for presentation export
- `tests/fixtures/` - Sample MARP-flavored Markdown files

**Sub-Tasks:**
- [ ] 0901 Implement the presentation export converter skeleton in `src/export/presentation.ts`: `name: "presentation"`, `category: "presentation"`, `formats: [{ extension: ".pptx", ... }, { extension: ".html", ... }, { extension: ".pdf", ... }]`.
- [ ] 0902 Implement MARP integration: import `@marp-team/marp-cli` and use its API (or invoke it as a subprocess) to convert Markdown to the requested output format. Pass the input Markdown content, output format, and any MARP-specific options.
- [ ] 0903 Implement theme application: read the `presentation` section of the resolved theme and inject MARP directives into the Markdown frontmatter before conversion. Map theme properties to MARP directives: `theme`, `paginate`, `backgroundColor`, `header`, `footer`, and custom `style` CSS.
- [ ] 0904 Handle the case where the input Markdown already has MARP frontmatter: merge theme settings with existing frontmatter (theme settings take precedence unless the frontmatter explicitly overrides).
- [ ] 0905 Write unit tests: create a sample MARP Markdown file, export to HTML (easiest to verify), and check that the output contains expected slide content and theme-applied styles. Test PPTX and PDF output by verifying the buffer is non-empty and has the correct MIME type.
- [ ] 0906 Register the presentation export converter in `src/cli/setup-registry.ts`.

**Notes:**
- MARP is a regular dependency (always installed).
- MARP CLI may need to be invoked as a subprocess (`npx @marp-team/marp-cli`) or via its Node.js API if available.
- The MARP CLI may write to the filesystem — use temp files and clean up after conversion.
- Presentation PDF export is available through MARP (this is distinct from the deferred document PDF export).

---

### [ ] 1000 - Export Converter: Transcript (Markdown to VTT/SRT)

**Overview:** Implement the transcript export converter. Parse the shared transcript Markdown format (defined in task 0500) and reconstruct proper `.vtt` (WebVTT) and `.srt` (SubRip) files with correct timestamp formatting, sequential numbering, and speaker labels (VTT only).

**Relevant Files:**
- `src/export/transcript.ts` - Transcript export converter
- `src/export/transcript.test.ts` - Tests for VTT/SRT export
- `tests/fixtures/` - Sample transcript Markdown files

**Sub-Tasks:**
- [ ] 1001 Implement the transcript export converter skeleton in `src/export/transcript.ts`: `name: "transcript"`, `category: "transcript"`, `formats: [{ extension: ".vtt", mimeType: "text/vtt", label: "WebVTT" }, { extension: ".srt", mimeType: "application/x-subrip", label: "SubRip" }]`.
- [ ] 1002 Implement Markdown transcript parsing: parse the shared transcript Markdown format (timestamp lines, speaker labels, text content). Extract an array of cue objects: `{ startTime, endTime, speaker?, text }`.
- [ ] 1003 Implement VTT output generation: produce a valid WebVTT file with `WEBVTT` header, sequential cue blocks with timestamps in `HH:MM:SS.mmm` format, and speaker labels as `<v>` tags where present. Apply theme `transcript` settings (timestamp format, speaker label inclusion).
- [ ] 1004 Implement SRT output generation: produce a valid SRT file with sequential numbering (starting at 1), timestamps in `HH:MM:SS,mmm` format (note: SRT uses comma, not period, for milliseconds), and text content. No speaker labels in SRT output.
- [ ] 1005 Write round-trip tests: ingest a `.vtt` fixture (from task 0500) → Markdown → export back to `.vtt`. Compare the output with the original (content should match, minor formatting differences are acceptable). Do the same for `.srt`.
- [ ] 1006 Write unit tests for edge cases: empty transcript, single cue, cue with multi-line text, cue with special characters.
- [ ] 1007 Register the transcript export converter in `src/cli/setup-registry.ts`.

**Notes:**
- This converter depends on the transcript Markdown format defined in task 0501. Coordinate the format.
- VTT timestamps use periods for milliseconds (`00:00:01.000`), SRT uses commas (`00:00:01,000`).
- Theme `transcript` section controls: `includeTimestamps`, `timestampFormat`, `speakerLabels`.

---

### [ ] 1100 - Theme System: Loader, Inheritance, and Built-in Themes

**Overview:** Implement the theme system — YAML loading, directory-tree resolution, theme inheritance via `extends`, color variable substitution (`$primary`, `$accent`), schema validation with warnings, and the four built-in themes (`default`, `professional`, `modern`, `minimal`).

**Relevant Files:**
- `src/core/theme-loader.ts` - Theme resolution, loading, inheritance, and variable substitution
- `src/core/theme-schema.ts` - `ResolvedTheme` type definition, default values, schema validation
- `src/themes/default.yaml` - Built-in default theme
- `src/themes/professional.yaml` - Built-in professional theme
- `src/themes/modern.yaml` - Built-in modern theme
- `src/themes/minimal.yaml` - Built-in minimal theme
- `src/core/theme-loader.test.ts` - Tests for theme loading, inheritance, and validation

**Sub-Tasks:**
- [ ] 1101 Define the `ResolvedTheme` TypeScript type in `src/core/theme-schema.ts`: all theme sections (colors, typography, spacing, document, spreadsheet, presentation, transcript, defaults) fully typed. Define default values for every field so that a completely empty theme still produces a valid `ResolvedTheme`.
- [ ] 1102 Implement theme file loading in `src/core/theme-loader.ts`: read a `.markwell.yaml` file, parse it with the `yaml` package, and return the raw theme object.
- [ ] 1103 Implement directory-tree resolution: given an input file path, walk up the directory tree looking for `.markwell.yaml`. Return the first one found, or `null`.
- [ ] 1104 Implement theme resolution logic: check `--theme` CLI flag first (look up by name in built-in themes, or load from file path), then try directory-tree resolution, then fall back to the built-in `default` theme.
- [ ] 1105 Implement theme inheritance: if a theme has an `extends` field, load the base theme (by name from built-ins or by path), then deep-merge the child theme on top. Support chained inheritance (theme A extends B extends C). Detect circular inheritance and throw an error.
- [ ] 1106 Implement color variable substitution: after merging, walk the entire theme object and replace any string value matching `$<name>` (e.g., `$primary`, `$accent`) with the corresponding value from the `colors` section. Handle nested references (e.g., `$primary` in typography that references `colors.primary`).
- [ ] 1107 Implement schema validation with warnings: after loading and merging a theme, validate known fields against expected types. Print warnings for unknown fields or invalid values (e.g., "Warning: Unknown field 'colrs' in theme — did you mean 'colors'?"). Do not fail — still apply valid fields.
- [ ] 1108 Create the `default.yaml` built-in theme in `src/themes/`: clean, minimal styling. Define all sections with sensible defaults (Calibri font, 11pt body, standard margins, etc.).
- [ ] 1109 Create the `professional.yaml` built-in theme: corporate/consulting style. Extends `default`. Darker primary colors, Calibri font, stricter spacing.
- [ ] 1110 Create the `modern.yaml` built-in theme: contemporary with bolder accent colors. Extends `default`.
- [ ] 1111 Create the `minimal.yaml` built-in theme: stripped down, content-focused. Extends `default`. Fewer decorative elements.
- [ ] 1112 Write unit tests for: theme loading from file, directory-tree resolution (mock filesystem), inheritance (single level and chained), color variable substitution, circular inheritance detection, schema validation warnings, fallback to default theme.

**Notes:**
- The `yaml` npm package is loaded eagerly (not lazy-loaded) since theme loading happens at startup for export commands.
- Deep merge must handle nested objects correctly (merge objects, replace arrays and primitives).
- Color variables use `$` prefix — only replace exact matches in string values, not partial matches.
- Built-in themes are YAML files bundled in the package. They need to be accessible at runtime — ensure the build process copies them to `dist/themes/`.

---

### [ ] 1200 - Theme CLI Commands and Install-Skills Command

**Overview:** Implement the `themes list`, `themes preview`, `themes init` CLI commands, and the `install-skills` command that copies the Claude Code skill file to the project or global `.claude/` directory.

**Relevant Files:**
- `src/cli/commands/themes.ts` - Theme CLI commands (list, preview, init)
- `src/cli/commands/install-skills.ts` - Install-skills command
- `src/skills/markwell.md` - Claude Code skill template file
- `src/cli/commands/themes.test.ts` - Tests for theme commands
- `src/cli/commands/install-skills.test.ts` - Tests for install-skills

**Sub-Tasks:**
- [ ] 1201 Implement `markwell themes list` in `src/cli/commands/themes.ts`: display all built-in themes (name + description) and any `.markwell.yaml` files found by walking up the directory tree from the current working directory. Format as a clean list.
- [ ] 1202 Implement `markwell themes preview <name>` : load the specified theme (by name or file path), resolve inheritance and variables, and display the fully resolved theme in a readable format — show colors as a table, typography settings, spacing, and category-specific settings.
- [ ] 1203 Implement `markwell themes init`: create a starter `.markwell.yaml` file in the current directory. The starter file should have `extends: default`, a commented-out `colors` section, and a commented-out `document` section to help users get started. Respect the overwrite prompt (don't overwrite an existing `.markwell.yaml` without `--force`).
- [ ] 1204 Create the Claude Code skill template in `src/skills/markwell.md` with the content specified in the PRD brainstorm (usage examples for ingest, export, themes, output location, and the categories/formats table).
- [ ] 1205 Implement `markwell install-skills` in `src/cli/commands/install-skills.ts`: copy `markwell.md` from the bundled skills directory to `.claude/commands/markwell.md` in the current project directory. Create the `.claude/commands/` directory if it doesn't exist.
- [ ] 1206 Implement `markwell install-skills --global`: copy to `~/.claude/commands/markwell.md` instead.
- [ ] 1207 Write unit tests for: `themes list` output format, `themes preview` with a known built-in theme, `themes init` file creation and overwrite protection, `install-skills` file copying (mock filesystem).
- [ ] 1208 Wire up all commands in `src/cli/index.ts` — replace any stubs with the real implementations.

**Notes:**
- `themes init` should respect the `--force` flag for overwriting an existing `.markwell.yaml`.
- `install-skills` should create parent directories if they don't exist.
- The skill template file needs to be bundled with the package — ensure the build process copies `src/skills/` to `dist/skills/`.

---

### [ ] 1300 - CI/CD Pipeline and Final Integration

**Overview:** Set up GitHub Actions for CI (lint, type check, test, build on Node 18 + 20 matrix) and CD (publish to npm on release tag). Run end-to-end integration tests verifying the full pipeline: converter registration, CLI commands, glob batch processing, theme application, round-trip fidelity, and startup performance.

**Relevant Files:**
- `.github/workflows/ci.yml` - CI workflow
- `.github/workflows/release.yml` - CD workflow (publish to npm)
- `tests/integration/round-trip.test.ts` - Round-trip fidelity tests
- `tests/integration/cli.test.ts` - CLI end-to-end tests
- `tests/integration/startup.test.ts` - Startup performance test

**Sub-Tasks:**
- [ ] 1301 Create `.github/workflows/ci.yml`: trigger on push to `main` and PRs. Matrix: Node.js 18 and 20. Steps: checkout, setup Node, `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test -- --coverage`, `npm run build`.
- [ ] 1302 Create `.github/workflows/release.yml`: trigger on release tags (`v*`). Steps: checkout, setup Node, `npm ci`, `npm run build`, `npm publish --provenance --access public`.
- [ ] 1303 Write a startup performance test (`tests/integration/startup.test.ts`): spawn `node dist/cli/index.js --help` as a child process, measure time from spawn to exit, assert it completes in under 500ms. This validates lazy-loading is working.
- [ ] 1304 Write CLI end-to-end tests (`tests/integration/cli.test.ts`): test the full CLI with real file conversions. Test ingest (`.docx` → `.md`), export (`.md` → `.docx`), `--dry-run`, `--force`, glob patterns, and error summary output.
- [ ] 1305 Write round-trip fidelity tests (`tests/integration/round-trip.test.ts`): convert `.docx` → `.md` → `.docx` and verify content is preserved. Convert `.vtt` → `.md` → `.vtt` and verify timestamps and text are preserved. Convert `.csv` → `.xlsx` and verify data integrity.
- [ ] 1306 Verify all converters are registered: write a test that imports the configured registry and asserts the expected number of ingest converters (10) and export converters (4) are registered.
- [ ] 1307 Verify `converters list`, `converters info`, `themes list`, `themes preview`, `themes init`, and `install-skills` commands all work end-to-end.
- [ ] 1308 Final cleanup: remove the placeholder `index.js` and `nul` file from the repo root. Update `package.json` description. Add a `LICENSE` file if not present. Verify `npm pack` produces a clean package.

**Notes:**
- Integration tests may need to build the project first (`npm run build`) before testing CLI commands.
- Round-trip tests should focus on content preservation, not exact formatting match.
- The CI workflow should upload coverage reports as artifacts.
- The CD workflow needs `NPM_TOKEN` configured as a repository secret.

---

## Notes

- Unit tests should be placed alongside the code files they test (e.g., `src/ingest/docx.ts` and `src/ingest/docx.test.ts`).
- Use `npx vitest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Vitest configuration.
- All heavy dependencies must be lazy-loaded via dynamic `import()` to keep CLI startup under 500ms.
- Tasks 0100–0300 are foundational and must be completed sequentially before converter tasks.
- Ingest converter tasks (0400–0600) can be worked on in parallel after task 0300.
- Export converter tasks (0700–1000) can be worked on in parallel, but benefit from task 1100 (theme system). They can be developed using the built-in default theme object as a placeholder.
- Task 1100 (theme system) should be completed before task 1200 (theme CLI commands).
- Task 1300 (CI/CD + integration) should be done last, after all converters and theme system are complete.

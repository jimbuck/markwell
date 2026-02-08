# Markwell — Product Requirements Document

## Phases I through III: Ingest, Export, and Themes

---

## 1. Introduction / Overview

**Markwell** is a CLI tool that converts documents to and from Markdown. Markdown (and CSV for tabular data) serves as the universal interchange format — the "hub" through which all documents flow.

The tool solves a common problem for consultants and knowledge workers: converting between document formats (Word, Excel, PowerPoint, transcripts) while maintaining content fidelity and consistent styling. Rather than juggling multiple conversion tools, Markwell provides a single CLI that handles ingest (any format to Markdown), export (Markdown to any format), and theming (consistent visual styles across exports).

The primary audience is **consultants and knowledge workers** who may not be deeply technical but work with document pipelines, often guided by Claude Code or automation scripts. The CLI should be approachable: clear error messages, sensible defaults, and predictable behavior.

**Package:** `markwell` on npm
**CLI:** `markwell` / `npx markwell`

---

## 2. Goals

1. **Universal ingest**: Convert `.docx`, `.xlsx`, `.pptx`, `.vtt`, `.srt`, `.json`, `.excalidraw`, `.rtf`, `.html`, and MARP-flavored `.md` files into clean Markdown or CSV.
2. **Polished export**: Convert Markdown/CSV back into `.docx`, `.xlsx`, `.pptx`, `.html`, `.vtt`, and `.srt` with professional styling. (Document PDF export is deferred; PDF is available for presentations via MARP.)
3. **Consistent theming**: Support `.markwell.yaml` theme files with inheritance, color variables, and per-category styling (document, spreadsheet, presentation, transcript).
4. **Single-package simplicity**: Ship as one npm package with no plugin system. All converters are internal. Heavy dependencies are lazy-loaded.
5. **Approachable CLI**: Provide clear help text, `--dry-run` for previewing operations, `--verbose` for debugging, and sensible defaults so users can convert files with minimal flags.
6. **Claude Code integration**: Include an `install-skills` command that installs a Claude Code skill file, enabling AI-assisted document workflows.

---

## 3. User Stories

### Ingest

- **US-1**: As a consultant, I want to convert a `.docx` file to Markdown so that I can edit it in a text editor and track changes with Git.
- **US-2**: As a project manager, I want to convert an `.xlsx` spreadsheet into CSV files (one per sheet) so that I can review the data in plain text.
- **US-3**: As a trainer, I want to convert a `.pptx` presentation to Markdown so that I can repurpose slide content in other documents.
- **US-4**: As a meeting organizer, I want to convert a `.vtt` or `.srt` transcript to Markdown so that I can search and annotate meeting notes.
- **US-5**: As a developer, I want to convert `.json` files to Markdown summaries so that I can document API schemas or configuration files.
- **US-6**: As a designer, I want to convert Excalidraw `.json` drawings to Markdown (with Mermaid diagrams where possible) so that diagrams live alongside documentation.
- **US-7**: As a user, I want to batch-convert a folder of mixed file types to Markdown using a glob pattern so that I can process many files at once.

### Export

- **US-8**: As a consultant, I want to convert a Markdown report to `.docx` so that I can deliver it to a client in their expected format.
- **US-9**: As an analyst, I want to convert CSV files into a styled `.xlsx` workbook so that I can share data with stakeholders.
- **US-10**: As a presenter, I want to convert a Markdown file to `.pptx` (via MARP) so that I can present slides in PowerPoint.
- **US-11**: As a transcriber, I want to convert a Markdown transcript back to `.vtt` or `.srt` so that I can re-attach captions to a video.
- **US-12**: As a user, I want to export to multiple formats at once (e.g., `.docx` and `.pdf`) so that I don't have to run the command twice.

### Themes

- **US-13**: As a consultant, I want to apply a "professional" theme to my exports so that all deliverables have consistent corporate styling.
- **US-14**: As a team lead, I want to define a custom `.markwell.yaml` theme for my project so that all team members produce documents with the same look and feel.
- **US-15**: As a user, I want my project theme to inherit from a built-in theme and override only specific values so that I don't have to redefine everything.

### General

- **US-16**: As a user, I want a `--dry-run` flag so that I can preview what files will be created before actually running the conversion.
- **US-17**: As a user, I want to be prompted before existing files are overwritten so that I don't accidentally lose work. I want a `--force` flag to skip the prompt.
- **US-18**: As a user, I want a `--verbose` flag so that I can see which converter was selected, timing information, and other details when troubleshooting.

---

## 4. Functional Requirements

### 4.1 Converter Registry

1. The system must maintain a registry of ingest converters and export converters.
2. Ingest converter resolution must use a two-stage strategy:
   - **Stage 1**: Filter converters by file extension match.
   - **Stage 2**: Call each matching converter's `canProcess()` method in registration order. The first converter to return `true` wins.
3. Specific converters (e.g., Excalidraw, MARP) must be registered before generic ones (e.g., JSON, Markdown) so they get priority during content inspection.
4. Export converter resolution must accept a category (`document`, `spreadsheet`, `presentation`, `transcript`) and an optional format string (e.g., `docx`, `pdf`).
5. The registry must provide methods to list all registered ingest and export converters.

### 4.2 CLI — `convert` Command

6. The CLI must accept a file path or glob pattern as the primary argument: `markwell convert <file-or-glob>`.
7. When no `--to` flag is provided, the CLI must perform **ingest** (convert the input file to Markdown/CSV).
8. When `--to` is provided, the CLI must perform **export** (convert Markdown/CSV to the specified output format).
9. The `--to` flag must support the following syntax:
   - `--to <category>` — use the default format for that category.
   - `--to <category>:<format>` — use a specific format.
   - `--to <category>:<fmt1>,<fmt2>` — output multiple formats.
10. Output files must default to the same directory as the input file, with the filename changed to match the output extension.
11. The `-o` flag must allow specifying an explicit output path (file or directory).
12. The `--force` flag must skip overwrite confirmation prompts and overwrite existing files silently.
13. Without `--force`, the CLI must prompt the user for confirmation before overwriting an existing file.
14. The `--dry-run` flag must show what files would be created or overwritten, without actually performing any conversion.
15. The `--verbose` flag must enable detailed output including: which converter was selected, processing steps, and timing.
16. The `--theme` flag must accept a theme name (built-in) or file path to a `.markwell.yaml` file. (Export only.)
17. When processing a glob pattern, the CLI must continue processing remaining files if one file fails, and print a summary of successes and failures at the end.

### 4.3 Ingest Converters

18. **DOCX/DOC** (`.docx`, `.doc`): Convert Word documents to Markdown using the `mammoth` library. Preserve headings, bold/italic, lists, tables, and links. The `canProcess` method must check for the OOXML zip signature.
19. **XLSX/XLS** (`.xlsx`, `.xls`, `.xlsm`): Convert spreadsheets to a directory of CSV files (one per sheet) using the `exceljs` library. Sheet names must be used as filenames (sanitized for filesystem safety). The `canProcess` method must check for the OOXML zip signature with a workbook entry.
20. **PPTX/PPT** (`.pptx`, `.ppt`): Convert presentations to Markdown using the `markitdown` library. Each slide becomes a section. Slide titles become headings. Speaker notes are included. The `canProcess` method must check for the OOXML zip signature with slide entries.
21. **VTT** (`.vtt`): Convert WebVTT transcripts to Markdown with speaker labels and timestamps. The `canProcess` method must validate the `WEBVTT` header.
22. **SRT** (`.srt`): Convert SubRip subtitle files to Markdown with timestamps, using the same Markdown structure as VTT (timestamps + text, without speaker labels since SRT does not natively support them). The `canProcess` method must validate the SRT sequential numbering format.
23. **JSON/JSONL/JSONC** (`.json`, `.jsonl`, `.jsonc`): Convert JSON to Markdown with a schema outline and summary/tabular data. This converter must yield to specialized converters (Excalidraw) that match the same extensions. The `canProcess` method must confirm the file contains valid JSON.
24. **Excalidraw** (`.excalidraw`, `.json`): Detect Excalidraw drawings by checking for `"type": "excalidraw"` in the JSON schema. Extract text labels and element descriptions to Markdown. Mermaid diagram generation from Excalidraw is deferred to Phase IV (Claude Code SDK); for now, include extracted text content only.
25. **MARP** (`.md`, `.markdown`): Detect MARP presentations by checking for `marp: true` in YAML frontmatter. Preserve the content as Markdown (the MARP content is already Markdown; this converter validates and passes it through, potentially stripping MARP-specific frontmatter for plain Markdown use).
26. **RTF** (`.rtf`): Convert Rich Text Format to Markdown. Preserve basic formatting (bold, italic, headings, lists).
27. **HTML** (`.html`, `.htm`): Convert HTML to Markdown using the `turndown` library or equivalent. Preserve headings, links, lists, tables, images, and basic formatting.

### 4.4 Export Converters

28. **Document** (category: `document`): Convert Markdown to `.docx` using the `docx` npm package. Apply theme styles for typography, colors, spacing, page layout, headers/footers, and table formatting. Document PDF export (`.pdf`) is deferred — only `.docx` is supported in Phases I–III.
29. **Spreadsheet** (category: `spreadsheet`): Convert CSV/TSV files to `.xlsx` using `exceljs`. When multiple CSV files are provided (or a directory of CSVs), create one sheet per file. Infer sheet names from filenames. Apply theme styles for header rows, column widths, and number formatting.
30. **Presentation** (category: `presentation`): Convert Markdown to `.pptx`, `.html`, and `.pdf` using MARP (`@marp-team/marp-cli`), which is included as a regular dependency. Apply theme styles for slide styling, pagination, and custom CSS.
31. **Transcript** (category: `transcript`): Convert Markdown (with timestamp/speaker metadata) back to `.vtt` and `.srt` formats. Reconstruct proper timestamp formatting and sequential numbering.

### 4.5 Theme System

32. Theme files must be named `.markwell.yaml`.
33. Theme resolution must follow this order:
    1. `--theme` CLI flag (theme name or file path).
    2. Nearest `.markwell.yaml` found by walking up the directory tree from the input file.
    3. Built-in `default` theme.
34. Themes must support inheritance via an `extends` field. Resolution: load the base theme, then deep-merge the child theme's overrides on top.
35. Themes must support color variables using `$` syntax (e.g., `$primary`, `$accent`) that reference values defined in the `colors` section.
36. The theme schema must include sections for:
    - `colors` — named color values.
    - `typography` — font families, sizes, and styles for headings, body, code, and blockquotes.
    - `spacing` — paragraph spacing, heading spacing, list indentation.
    - `document` — page size, margins, headers, footers, table styles.
    - `spreadsheet` — header row styling, column width, number formats.
    - `presentation` — MARP engine settings, theme, pagination, custom CSS.
    - `transcript` — timestamp format, speaker label settings.
37. The theme file must optionally support a `defaults` section for default export formats per category.
38. Four built-in themes must be bundled: `default`, `professional`, `modern`, `minimal`.
38a. Theme files must be validated against the schema on load. Unknown or invalid fields must produce warnings but not prevent the theme from being applied — valid fields are still used.

### 4.6 Theme Commands

39. `markwell themes list` must display all available themes (built-in and any found in the directory hierarchy).
40. `markwell themes preview <name>` must display the details of a theme (colors, typography settings, etc.).
41. `markwell themes init` must create a starter `.markwell.yaml` file in the current directory.

### 4.7 Other Commands

42. `markwell converters list` must display all registered ingest and export converters with their supported extensions and formats.
43. `markwell converters info <name>` must display detailed information about a specific converter.
44. `markwell install-skills` must install a Claude Code skill file into `.claude/` in the current project directory.
45. `markwell install-skills --global` must install the skill file into `~/.claude/`.
46. `markwell --version` must display the current version.
47. `markwell --help` must display usage information for all commands.

### 4.8 Asset Handling (Phase III)

48. During ingest, images and binary assets referenced in source documents must be extracted to an `assets/` directory alongside the output Markdown file.
49. Markdown image references must use relative paths pointing to the `assets/` directory (e.g., `![diagram](assets/image1.png)`).
50. During export, the export converter must read images from the `assets/` directory and embed them in the output document.

### 4.9 Lazy Loading

51. Heavy external dependencies (`mammoth`, `exceljs`, `@marp-team/marp-cli`, `turndown`, etc.) must be lazy-loaded — imported only when the relevant converter is invoked, not at CLI startup.

### 4.10 Mermaid Diagram Handling

52. Mermaid code blocks in Markdown (` ```mermaid `) must be treated as first-class content.
53. During ingest, diagrams that can be represented as Mermaid should be converted to Mermaid code blocks.
54. During ingest, complex diagrams that cannot be converted should be extracted as image assets with a placeholder comment in Markdown (e.g., `<!-- diagram: see assets/diagram1.png -->`).
55. During export, Mermaid code blocks must be rendered to SVG or PNG and embedded in the output document (using `@mermaid-js/mermaid-cli` or equivalent).

---

## 5. Non-Goals (Out of Scope)

1. **External plugin system**: All converters are internal to the package. No public plugin API.
2. **PDF ingest**: Reading/extracting content from PDF files is deferred to Phase IV (requires LLM vision).
3. **AI/LLM-powered conversion**: Claude Code SDK integration (intelligent restructuring, vision-based diagram conversion, alt-text generation) is deferred to Phase IV.
4. **GUI or web interface**: Markwell is CLI-only.
5. **Real-time file watching**: No watch mode or file system monitoring.
6. **Output directory in config**: Output location is always relative to the input file or overridden via `-o`. No `outputDir` setting in `.markwell.yaml`.
7. **Frontmatter-based export config**: Per-file export configuration via Markdown frontmatter is not planned.
8. **Streaming / large file optimization**: Initial implementation targets typical document sizes (< 50 MB). Streaming for very large files is out of scope.
9. **Programmatic API**: The primary interface is the CLI. A stable Node.js API for importing markwell as a library is not a goal for these phases (though the internal architecture should not preclude it).
10. **Document PDF export**: PDF output for the document category is deferred. PDF is available for presentations via MARP.
11. **Excalidraw-to-Mermaid diagram conversion**: Deferred to Phase IV (Claude Code SDK). The Excalidraw ingest converter extracts text content only.

---

## 6. Design Considerations

### CLI Output Format

- **Default output**: Clean, minimal. Show the input file, output file(s), and status (success/failure) for each conversion.
  ```
  report.docx -> report.md  [OK]
  budget.xlsx -> budget/Sheet1.csv, budget/Sheet2.csv  [OK]
  broken.docx -> [FAILED] Could not parse document

  3 files processed: 2 succeeded, 1 failed
  ```
- **Verbose output** (`--verbose`): Include converter selection, processing steps, and timing.
- **Dry run output** (`--dry-run`): Prefix each line with `[DRY RUN]` and show what would be created.
  ```
  [DRY RUN] report.docx -> report.md
  [DRY RUN] budget.xlsx -> budget/Sheet1.csv, budget/Sheet2.csv
  ```
- **Overwrite prompt**: When an output file already exists and `--force` is not set:
  ```
  report.md already exists. Overwrite? [y/N]
  ```

### Error Messages

- Error messages must be written in plain language, not stack traces.
- Include the file path and a description of what went wrong.
- Suggest corrective action where possible (e.g., "Try installing markwell globally: `npm i -g markwell`").

### Directory Structure (Source)

```
markwell/
  src/
    cli/
      index.ts              # CLI entry point (commander setup)
      commands/
        convert.ts          # convert command handler
        themes.ts           # themes list/preview/init commands
        converters.ts       # converters list/info commands
        install-skills.ts   # install-skills command
    core/
      registry.ts           # ConverterRegistry class
      types.ts              # shared interfaces (IngestConverter, ExportConverter, etc.)
      theme-loader.ts       # theme resolution, inheritance, variable substitution
      theme-schema.ts       # ResolvedTheme type and defaults
    ingest/
      docx.ts
      xlsx.ts
      pptx.ts
      vtt.ts
      srt.ts
      json.ts
      excalidraw.ts
      marp.ts
      rtf.ts
      html.ts
    export/
      document.ts
      spreadsheet.ts
      presentation.ts
      transcript.ts
    themes/
      default.yaml
      professional.yaml
      modern.yaml
      minimal.yaml
    skills/
      markwell.md           # Claude Code skill template
  tests/
    fixtures/               # sample input files for testing
    ingest/
    export/
    core/
  package.json
  tsconfig.json
  vitest.config.ts
```

---

## 7. Technical Considerations

### Runtime & Build

- **Runtime**: Node.js 18+.
- **Module system**: ESM (ES Modules).
- **Language**: TypeScript (strict mode).
- **Build tool**: tsdown for compilation and bundling.
- **Test framework**: Vitest.

### Key Dependencies

| Purpose | Library | Lazy-loaded? |
|---------|---------|:---:|
| DOCX to Markdown | `mammoth` | Yes |
| Markdown to DOCX | `docx` | Yes |
| XLSX read/write | `exceljs` | Yes |
| PPTX to Markdown | `markitdown` | Yes |
| MARP rendering | `@marp-team/marp-cli` | No (regular dependency) |
| HTML to Markdown | `turndown` | Yes |
| RTF parsing | `rtf-parser` or equivalent | Yes |
| Markdown parsing | `unified` + `remark` | Yes |
| YAML parsing | `yaml` | No (small, used at startup for theme loading) |
| CLI framework | `commander` | No |
| Glob matching | `fast-glob` | No |
| Mermaid rendering | `@mermaid-js/mermaid-cli` | Yes |

### Lazy Loading Pattern

```typescript
// Example: lazy-load mammoth only when the DOCX converter runs
async function loadMammoth() {
  const { default: mammoth } = await import("mammoth");
  return mammoth;
}
```

This keeps CLI startup fast — only the CLI framework, commander, and registry setup code are loaded eagerly.

### Overwrite Behavior

- Before writing any output file, check if the file already exists.
- If it exists and `--force` is not set, prompt the user for confirmation via stdin.
- If running in a non-interactive environment (no TTY), default to refusing the overwrite and printing an error suggesting `--force`.

---

## 8. Success Metrics

1. **Converter coverage**: All ingest converters listed in section 4.3 and export converters listed in section 4.4 are implemented and pass tests with representative fixture files.
2. **Round-trip fidelity**: A document that goes through ingest (e.g., `.docx` to `.md`) and then export (`.md` to `.docx`) retains all textual content, headings, lists, tables, and links. Formatting may differ based on the applied theme, but no content is lost.
3. **Theme application**: Exported documents with a theme applied visually match the theme's specified colors, fonts, and spacing.
4. **CLI usability**: The `--help` output for every command is clear and complete. Error messages are actionable. `--dry-run` accurately reflects what a real run would do.
5. **Startup performance**: CLI startup (time to display `--help`) completes in under 500ms on a standard machine, validating that lazy-loading is working.
6. **Test coverage**: Minimum 80% line coverage across the codebase.
7. **npm installability**: `npx markwell --help` works on a fresh machine with Node.js 18+ without additional setup.

---

## 9. CI/CD Pipeline

The project must use **GitHub Actions** for continuous integration and deployment.

### CI (on every PR and push to main)

1. **Lint**: Run ESLint with the project's TypeScript configuration.
2. **Type check**: Run `tsc --noEmit` to verify type safety.
3. **Test**: Run `vitest run` with coverage reporting.
4. **Build**: Run `tsdown` to verify the package builds successfully.
5. Run on Node.js 18 and Node.js 20 (matrix).

### CD (on release tag)

1. Build the package.
2. Publish to npm with provenance.

---

## 10. Resolved Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | **PPTX ingest library** | Use **markitdown** (Microsoft's open-source library). |
| 2 | **PDF export pipeline** | **Deferred.** Document PDF export is out of scope for Phases I–III. DOCX only for the document category. PDF remains available for presentations via MARP. |
| 3 | **MARP as a dependency** | **Regular dependency.** Always installed, always available. No extra install step for users. |
| 4 | **SRT ingest format** | **Same Markdown structure as VTT** — timestamps + text. No speaker labels (SRT doesn't natively support them). Consistent output format enables round-tripping. |
| 5 | **Excalidraw to Mermaid** | **Deferred to Phase IV** (Claude Code SDK). The Excalidraw ingest converter will extract text content only — no Mermaid diagram generation. |
| 6 | **Theme validation** | **Validate + warn.** Parse against the schema, print warnings for unknown or invalid fields, but still apply valid fields. Don't fail on validation errors. |

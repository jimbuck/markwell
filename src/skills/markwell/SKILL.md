---
name: markwell
description: Convert documents to and from Markdown using the markwell CLI
allowed-tools: Bash
---

# Markwell - Document Converter

Markwell converts documents to and from Markdown. Markdown is the universal hub format.

## Ingest (to Markdown)

Convert any supported file to Markdown:

```bash
markwell convert document.docx           # → document.md
markwell convert spreadsheet.xlsx        # → spreadsheet/ (CSV per sheet)
markwell convert presentation.pptx      # → presentation.md
markwell convert transcript.vtt         # → transcript.md
markwell convert page.html              # → page.md
markwell convert data.json              # → data.md (schema outline)
```

## Export (from Markdown)

Convert Markdown to styled output:

```bash
markwell convert document.md --to document          # → document.docx
markwell convert data.csv --to spreadsheet           # → data.xlsx
markwell convert slides.md --to presentation         # → slides.html
markwell convert slides.md --to presentation:pptx    # → slides.pptx
markwell convert transcript.md --to transcript:vtt   # → transcript.vtt
markwell convert transcript.md --to transcript:srt   # → transcript.srt
```

## Supported Formats

| Category     | Ingest From          | Export To         |
| ------------ | -------------------- | ----------------- |
| Document     | .docx, .doc          | .docx             |
| Spreadsheet  | .xlsx, .xls, .xlsm   | .xlsx             |
| Presentation | .pptx, .ppt          | .html, .pptx, .pdf |
| Transcript   | .vtt, .srt           | .vtt, .srt        |
| Web          | .html, .htm          | —                 |
| Rich Text    | .rtf                 | —                 |
| Data         | .json, .jsonl, .jsonc | —                |
| Drawing      | .excalidraw          | —                 |
| Slides (MD)  | .md (MARP)           | —                 |

## Themes

Apply visual styling to exports:

```bash
markwell convert doc.md --to document --theme professional
markwell themes list        # Show available themes
markwell themes preview modern  # Preview theme settings
markwell themes init        # Create .markwell.yaml in current directory
```

Built-in themes: `default`, `professional`, `modern`, `minimal`

## Options

- `-o, --output <path>`: Output file or directory
- `--to <category[:format]>`: Export category and optional format
- `--theme <name|path>`: Theme name or path to .markwell.yaml
- `--force`: Overwrite without prompting
- `--dry-run`: Show what would happen without writing files
- `--verbose`: Show detailed processing info

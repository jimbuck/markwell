import type {
  ExportConverter,
  ExportInput,
  ExportOutput,
  ResolvedTheme,
} from "../core/types.js";
import type {
  Heading,
  Paragraph as MdParagraph,
  Text,
  Strong,
  Emphasis,
  InlineCode,
  Code,
  Link,
  List,
  ListItem,
  Blockquote,
  Table as MdTable,
  TableRow as MdTableRow,
  TableCell as MdTableCell,
  Image,
  PhrasingContent,
  BlockContent,
} from "mdast";
import { parseMarkdown } from "./utils/markdown-parser.js";

// Default theme values for document export
const DEFAULT_FONT = "Calibri";
const DEFAULT_BODY_SIZE = 22; // half-points (11pt)
const DEFAULT_HEADING_SIZES: Record<number, number> = {
  1: 48, // 24pt
  2: 40, // 20pt
  3: 32, // 16pt
  4: 28, // 14pt
  5: 24, // 12pt
  6: 22, // 11pt
};

interface TextRunOpts {
  bold?: boolean;
  italics?: boolean;
  font?: string;
  size?: number;
  color?: string;
  code?: boolean;
}

async function loadDocx() {
  return await import("docx");
}

function getThemeFont(theme: ResolvedTheme): string {
  return (theme.typography?.fontFamily as string) ?? DEFAULT_FONT;
}

function getThemeBodySize(theme: ResolvedTheme): number {
  return (theme.typography?.bodySize as number) ?? DEFAULT_BODY_SIZE;
}

function getThemeHeadingSize(theme: ResolvedTheme, level: number): number {
  const sizes = theme.typography?.headingSizes as
    | Record<number, number>
    | undefined;
  return sizes?.[level] ?? DEFAULT_HEADING_SIZES[level] ?? DEFAULT_BODY_SIZE;
}

function getThemeColor(theme: ResolvedTheme, key: string): string | undefined {
  return theme.colors?.[key];
}

function getThemeSpacing(
  theme: ResolvedTheme,
  key: string,
): number | undefined {
  return theme.spacing?.[key] as number | undefined;
}

function convertInlineContent(
  nodes: PhrasingContent[],
  docx: Awaited<ReturnType<typeof loadDocx>>,
  opts: TextRunOpts = {},
): (InstanceType<typeof docx.TextRun> | InstanceType<typeof docx.ExternalHyperlink>)[] {
  const runs: (InstanceType<typeof docx.TextRun> | InstanceType<typeof docx.ExternalHyperlink>)[] =
    [];

  for (const node of nodes) {
    switch (node.type) {
      case "text":
        runs.push(
          new docx.TextRun({
            text: (node as Text).value,
            bold: opts.bold,
            italics: opts.italics,
            font: opts.code ? "Courier New" : opts.font,
            size: opts.size,
            color: opts.color,
          }),
        );
        break;

      case "strong":
        runs.push(
          ...convertInlineContent(
            (node as Strong).children,
            docx,
            { ...opts, bold: true },
          ),
        );
        break;

      case "emphasis":
        runs.push(
          ...convertInlineContent(
            (node as Emphasis).children,
            docx,
            { ...opts, italics: true },
          ),
        );
        break;

      case "inlineCode":
        runs.push(
          new docx.TextRun({
            text: (node as InlineCode).value,
            font: "Courier New",
            size: opts.size,
            bold: opts.bold,
            italics: opts.italics,
          }),
        );
        break;

      case "link": {
        const linkNode = node as Link;
        const children = convertInlineContent(
          linkNode.children,
          docx,
          opts,
        );
        runs.push(
          new docx.ExternalHyperlink({
            link: linkNode.url,
            children: children.length > 0
              ? children
              : [new docx.TextRun({ text: linkNode.url })],
          }),
        );
        break;
      }

      case "break":
        runs.push(new docx.TextRun({ break: 1 }));
        break;

      default:
        // For unhandled inline nodes, try to extract text
        if ("value" in node && typeof node.value === "string") {
          runs.push(new docx.TextRun({ text: node.value, ...opts }));
        }
        break;
    }
  }

  return runs;
}

function convertBlockNodes(
  nodes: BlockContent[],
  docx: Awaited<ReturnType<typeof loadDocx>>,
  theme: ResolvedTheme,
  assets?: Map<string, Buffer>,
): (InstanceType<typeof docx.Paragraph> | InstanceType<typeof docx.Table>)[] {
  const elements: (InstanceType<typeof docx.Paragraph> | InstanceType<typeof docx.Table>)[] = [];
  const font = getThemeFont(theme);
  const bodySize = getThemeBodySize(theme);
  const bodyColor = getThemeColor(theme, "text");
  const spacingAfter = getThemeSpacing(theme, "paragraphAfter") ?? 120;

  for (const node of nodes) {
    switch (node.type) {
      case "heading": {
        const h = node as Heading;
        const level = h.depth;
        const headingSize = getThemeHeadingSize(theme, level);
        const headingColor = getThemeColor(theme, "primary");
        const beforeSpacing =
          getThemeSpacing(theme, "headingBefore") ?? 240;
        const afterSpacing =
          getThemeSpacing(theme, "headingAfter") ?? 120;

        elements.push(
          new docx.Paragraph({
            heading: `Heading${level}` as
              | "Heading1"
              | "Heading2"
              | "Heading3"
              | "Heading4"
              | "Heading5"
              | "Heading6",
            spacing: { before: beforeSpacing, after: afterSpacing },
            children: convertInlineContent(h.children, docx, {
              font,
              size: headingSize,
              bold: true,
              color: headingColor,
            }),
          }),
        );
        break;
      }

      case "paragraph": {
        const p = node as MdParagraph;

        // Check for standalone image
        if (
          p.children.length === 1 &&
          p.children[0].type === "image"
        ) {
          const img = p.children[0] as Image;
          const imageData = assets?.get(img.url);
          if (imageData) {
            elements.push(
              new docx.Paragraph({
                children: [
                  new docx.ImageRun({
                    data: imageData,
                    transformation: { width: 400, height: 300 },
                    type: "png",
                  }),
                ],
                spacing: { after: spacingAfter },
              }),
            );
            break;
          }
        }

        elements.push(
          new docx.Paragraph({
            spacing: { after: spacingAfter },
            children: convertInlineContent(p.children, docx, {
              font,
              size: bodySize,
              color: bodyColor,
            }),
          }),
        );
        break;
      }

      case "code": {
        const codeNode = node as Code;
        const codeLines = codeNode.value.split("\n");
        for (const line of codeLines) {
          elements.push(
            new docx.Paragraph({
              spacing: { after: 0 },
              indent: { left: 720 },
              children: [
                new docx.TextRun({
                  text: line,
                  font: "Courier New",
                  size: bodySize - 2,
                }),
              ],
            }),
          );
        }
        // Add spacing after code block
        elements.push(
          new docx.Paragraph({ spacing: { after: spacingAfter } }),
        );
        break;
      }

      case "blockquote": {
        const bq = node as Blockquote;
        // Extract inline content from blockquote paragraphs
        for (const bqChild of bq.children) {
          if (bqChild.type === "paragraph") {
            elements.push(
              new docx.Paragraph({
                indent: { left: 720 },
                border: {
                  left: { style: "single" as const, size: 6, color: "CCCCCC" },
                },
                spacing: { after: spacingAfter },
                children: convertInlineContent(
                  (bqChild as MdParagraph).children,
                  docx,
                  { font, size: bodySize, color: bodyColor },
                ),
              }),
            );
          }
        }
        break;
      }

      case "list": {
        const list = node as List;
        const ordered = list.ordered ?? false;

        for (let i = 0; i < list.children.length; i++) {
          const item = list.children[i] as ListItem;
          // Get the first paragraph content from the list item
          for (const child of item.children) {
            if (child.type === "paragraph") {
              elements.push(
                new docx.Paragraph({
                  bullet: ordered ? undefined : { level: 0 },
                  numbering: ordered
                    ? { reference: "default-numbering", level: 0 }
                    : undefined,
                  spacing: { after: 40 },
                  children: convertInlineContent(
                    (child as MdParagraph).children,
                    docx,
                    { font, size: bodySize, color: bodyColor },
                  ),
                }),
              );
            } else if (child.type === "list") {
              // Nested list
              const nestedElements = convertBlockNodes(
                [child],
                docx,
                theme,
                assets,
              );
              elements.push(...nestedElements);
            }
          }
        }
        break;
      }

      case "table": {
        const table = node as MdTable;
        const rows = table.children as MdTableRow[];
        const headerBg = getThemeColor(theme, "accent") ?? "4472C4";
        const headerTextColor = "FFFFFF";

        const docxRows = rows.map((row, rowIdx) => {
          const cells = (row.children as MdTableCell[]).map((cell) => {
            const isHeader = rowIdx === 0;
            return new docx.TableCell({
              shading: isHeader
                ? { fill: headerBg, type: "clear" as const }
                : undefined,
              children: [
                new docx.Paragraph({
                  children: convertInlineContent(cell.children, docx, {
                    font,
                    size: bodySize,
                    bold: isHeader,
                    color: isHeader ? headerTextColor : bodyColor,
                  }),
                }),
              ],
            });
          });
          return new docx.TableRow({ children: cells });
        });

        elements.push(
          new docx.Table({
            rows: docxRows,
            width: { size: 100, type: "pct" as const },
          }),
        );
        // Spacing after table
        elements.push(
          new docx.Paragraph({ spacing: { after: spacingAfter } }),
        );
        break;
      }

      case "thematicBreak": {
        elements.push(
          new docx.Paragraph({
            border: {
              bottom: { style: "single" as const, size: 6, color: "CCCCCC" },
            },
            spacing: { before: 240, after: 240 },
          }),
        );
        break;
      }

      default:
        // Skip unhandled block types
        break;
    }
  }

  return elements;
}

export const documentExport: ExportConverter = {
  name: "document",
  category: "document",
  formats: [
    {
      extension: ".docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      label: "Word Document",
    },
    {
      extension: ".pdf",
      mimeType: "application/pdf",
      label: "PDF Document",
    },
    {
      extension: ".html",
      mimeType: "text/html",
      label: "HTML Document",
    },
  ],

  async export(input: ExportInput): Promise<ExportOutput> {
    if (input.format === ".pdf") {
      throw new Error(
        "Document PDF export is not yet implemented. Use 'docx' or 'word' instead.",
      );
    }

    if (input.format === ".html") {
      return renderDocumentHtml(input);
    }

    const docx = await loadDocx();

    const content =
      input.files[0]?.content ?? "";
    const tree = await parseMarkdown(content);
    const theme = input.theme;

    const font = getThemeFont(theme);
    const pageMargins = theme.document?.margins as
      | {
          top?: number;
          bottom?: number;
          left?: number;
          right?: number;
        }
      | undefined;

    // Build header/footer if configured
    const headerText = theme.document?.header as string | undefined;
    const footerText = theme.document?.footer as string | undefined;

    const headers = headerText
      ? {
          default: new docx.Header({
            children: [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: resolveTemplateVars(headerText),
                    font,
                    size: 18,
                    color: "888888",
                  }),
                ],
              }),
            ],
          }),
        }
      : undefined;

    const footers = footerText
      ? {
          default: new docx.Footer({
            children: [
              new docx.Paragraph({
                alignment: "center" as const,
                children: [
                  new docx.TextRun({
                    text: resolveTemplateVars(footerText),
                    font,
                    size: 18,
                    color: "888888",
                  }),
                ],
              }),
            ],
          }),
        }
      : undefined;

    const children = convertBlockNodes(
      tree.children as BlockContent[],
      docx,
      theme,
      input.assets,
    );

    const doc = new docx.Document({
      numbering: {
        config: [
          {
            reference: "default-numbering",
            levels: [
              {
                level: 0,
                format: "decimal" as const,
                text: "%1.",
                alignment: "start" as const,
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: pageMargins?.top ?? 1440,
                bottom: pageMargins?.bottom ?? 1440,
                left: pageMargins?.left ?? 1440,
                right: pageMargins?.right ?? 1440,
              },
            },
          },
          headers,
          footers,
          children,
        },
      ],
    });

    const buffer = await docx.Packer.toBuffer(doc);

    return {
      buffer: Buffer.from(buffer),
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: ".docx",
    };
  },
};

async function renderDocumentHtml(input: ExportInput): Promise<ExportOutput> {
  const content = input.files[0]?.content ?? "";
  const theme = input.theme;
  const font = getThemeFont(theme);
  const bodyColor = getThemeColor(theme, "text") ?? "333333";
  const primaryColor = getThemeColor(theme, "primary") ?? "2563eb";
  const bgColor = getThemeColor(theme, "background") ?? "ffffff";

  // Use unified/remark/rehype pipeline to convert markdown to HTML
  const { unified } = await import("unified");
  const remarkParse = (await import("remark-parse")).default;
  const remarkRehype = (await import("remark-rehype")).default;
  const rehypeStringify = (await import("rehype-stringify")).default;

  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content);

  const htmlBody = String(result);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {
    font-family: ${font}, sans-serif;
    color: #${bodyColor};
    background: #${bgColor};
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    line-height: 1.6;
  }
  h1, h2, h3, h4, h5, h6 { color: #${primaryColor}; }
  a { color: #${primaryColor}; }
  code { font-family: "Courier New", monospace; background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; }
  pre { background: #f5f5f5; padding: 1em; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #${primaryColor}; margin-left: 0; padding-left: 1em; color: #666; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #${primaryColor}; color: #fff; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

  return {
    buffer: Buffer.from(html, "utf-8"),
    mimeType: "text/html",
    extension: ".html",
  };
}

function resolveTemplateVars(text: string): string {
  const now = new Date();
  return text
    .replace(/\{date\}/g, now.toLocaleDateString())
    .replace(/\{title\}/g, "")
    .replace(/\{page\}/g, "")
    .replace(/\{pages\}/g, "");
}

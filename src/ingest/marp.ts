import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";

const MARP_FRONTMATTER_FIELDS = [
  "marp",
  "theme",
  "paginate",
  "backgroundColor",
  "backgroundImage",
  "header",
  "footer",
  "class",
  "size",
  "style",
  "math",
  "headingDivider",
];

function parseFrontmatter(content: string): {
  frontmatter: string;
  body: string;
} | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function hasMarpDirective(frontmatter: string): boolean {
  // Check for "marp: true" in the YAML frontmatter
  const lines = frontmatter.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "marp: true" || trimmed === "marp: yes") {
      return true;
    }
  }
  return false;
}

function stripMarpFields(frontmatter: string): string {
  const lines = frontmatter.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const key = line.split(":")[0].trim();
    if (!MARP_FRONTMATTER_FIELDS.includes(key)) {
      kept.push(line);
    }
  }
  return kept.filter((l) => l.trim() !== "").join("\n");
}

export const marpIngest: IngestConverter = {
  name: "marp",
  extensions: [".md", ".markdown"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    const parsed = parseFrontmatter(input.head);
    if (!parsed) return false;
    return hasMarpDirective(parsed.frontmatter);
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const content = input.buffer.toString("utf-8");
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      return { markdown: content, metadata: {} };
    }

    const remainingFrontmatter = stripMarpFields(parsed.frontmatter);

    let markdown: string;
    if (remainingFrontmatter) {
      markdown = `---\n${remainingFrontmatter}\n---\n\n${parsed.body}`;
    } else {
      markdown = parsed.body;
    }

    return {
      markdown: markdown.trim(),
      metadata: {
        wasMarp: true,
      },
    };
  },
};

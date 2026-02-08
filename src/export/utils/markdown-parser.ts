import type { Root } from "mdast";

let parserReady: Promise<(content: string) => Root> | null = null;

function getParser(): Promise<(content: string) => Root> {
  if (!parserReady) {
    parserReady = (async () => {
      const { unified } = await import("unified");
      const remarkParse = (await import("remark-parse")).default;
      const remarkGfm = (await import("remark-gfm")).default;

      const processor = unified().use(remarkParse).use(remarkGfm);

      return (content: string): Root => {
        return processor.parse(content);
      };
    })();
  }
  return parserReady;
}

export async function parseMarkdown(content: string): Promise<Root> {
  const parse = await getParser();
  return parse(content);
}

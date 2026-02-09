import { describe, it, expect } from "vitest";
import {
  resolveAlias,
  resolveToFlag,
  isMarpContent,
  getAliasesForCategory,
} from "./format-aliases.js";

const MARP_CONTENT = `---
marp: true
theme: default
---

# Slide 1
Hello world
`;

const PLAIN_MD = `# Just a document

Some regular markdown content.
`;

describe("isMarpContent", () => {
  it("returns true for marp frontmatter", () => {
    expect(isMarpContent(MARP_CONTENT)).toBe(true);
  });

  it("returns false for plain markdown", () => {
    expect(isMarpContent(PLAIN_MD)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isMarpContent("")).toBe(false);
  });

  it("returns false for frontmatter without marp: true", () => {
    const content = `---
title: Hello
---

# Content
`;
    expect(isMarpContent(content)).toBe(false);
  });
});

describe("resolveAlias", () => {
  describe("presentation aliases", () => {
    it.each(["presentation", "slides", "pptx", "ppt", "powerpoint"])(
      "resolves '%s' to presentation .pptx",
      (alias) => {
        const result = resolveAlias(alias);
        expect(result.category).toBe("presentation");
        expect(result.extension).toBe(".pptx");
      },
    );
  });

  describe("document aliases", () => {
    it.each(["document", "docx", "word", "doc"])(
      "resolves '%s' to document .docx",
      (alias) => {
        const result = resolveAlias(alias);
        expect(result.category).toBe("document");
        expect(result.extension).toBe(".docx");
      },
    );
  });

  describe("spreadsheet aliases", () => {
    it.each(["spreadsheet", "excel", "xlsx", "xls", "sheets"])(
      "resolves '%s' to spreadsheet .xlsx",
      (alias) => {
        const result = resolveAlias(alias);
        expect(result.category).toBe("spreadsheet");
        expect(result.extension).toBe(".xlsx");
      },
    );
  });

  describe("transcript aliases", () => {
    it("resolves 'vtt' to transcript .vtt", () => {
      const result = resolveAlias("vtt");
      expect(result.category).toBe("transcript");
      expect(result.extension).toBe(".vtt");
    });

    it("resolves 'srt' to transcript .srt", () => {
      const result = resolveAlias("srt");
      expect(result.category).toBe("transcript");
      expect(result.extension).toBe(".srt");
    });

    it("resolves 'transcription' to transcript .vtt", () => {
      const result = resolveAlias("transcription");
      expect(result.category).toBe("transcript");
      expect(result.extension).toBe(".vtt");
    });
  });

  describe("contextual aliases", () => {
    it("resolves 'pdf' with marp content to presentation .pdf", () => {
      const result = resolveAlias("pdf", { inputContent: MARP_CONTENT });
      expect(result.category).toBe("presentation");
      expect(result.extension).toBe(".pdf");
    });

    it("resolves 'pdf' without marp content to document .pdf", () => {
      const result = resolveAlias("pdf", { inputContent: PLAIN_MD });
      expect(result.category).toBe("document");
      expect(result.extension).toBe(".pdf");
    });

    it("resolves 'pdf' without context to document .pdf", () => {
      const result = resolveAlias("pdf");
      expect(result.category).toBe("document");
      expect(result.extension).toBe(".pdf");
    });

    it("resolves 'html' with marp content to presentation .html", () => {
      const result = resolveAlias("html", { inputContent: MARP_CONTENT });
      expect(result.category).toBe("presentation");
      expect(result.extension).toBe(".html");
    });

    it("resolves 'html' without marp content to document .html", () => {
      const result = resolveAlias("html", { inputContent: PLAIN_MD });
      expect(result.category).toBe("document");
      expect(result.extension).toBe(".html");
    });
  });

  describe("case insensitivity", () => {
    it("resolves uppercase aliases", () => {
      const result = resolveAlias("PPTX");
      expect(result.category).toBe("presentation");
      expect(result.extension).toBe(".pptx");
    });

    it("resolves mixed case aliases", () => {
      const result = resolveAlias("PowerPoint");
      expect(result.category).toBe("presentation");
      expect(result.extension).toBe(".pptx");
    });
  });

  describe("error handling", () => {
    it("throws for unknown alias", () => {
      expect(() => resolveAlias("video")).toThrow('Unknown format "video"');
    });

    it("throws helpful message for old category:format syntax", () => {
      expect(() => resolveAlias("transcript:vtt")).toThrow(
        "The 'category:format' syntax is no longer supported. Use '--to vtt' instead.",
      );
    });

    it("throws helpful message for old category:format with spaces", () => {
      expect(() => resolveAlias("document:docx")).toThrow(
        "The 'category:format' syntax is no longer supported. Use '--to docx' instead.",
      );
    });
  });
});

describe("resolveToFlag", () => {
  it("resolves a single alias", () => {
    const result = resolveToFlag("pptx");
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("presentation");
    expect(result[0].extension).toBe(".pptx");
  });

  it("resolves comma-separated aliases", () => {
    const result = resolveToFlag("docx,pdf", { inputContent: PLAIN_MD });
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe("document");
    expect(result[0].extension).toBe(".docx");
    expect(result[1].category).toBe("document");
    expect(result[1].extension).toBe(".pdf");
  });

  it("handles whitespace around commas", () => {
    const result = resolveToFlag("pptx , xlsx");
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe("presentation");
    expect(result[1].category).toBe("spreadsheet");
  });

  it("throws on empty value", () => {
    expect(() => resolveToFlag("")).toThrow("No format specified");
  });

  it("throws on unknown alias in list", () => {
    expect(() => resolveToFlag("docx,video")).toThrow('Unknown format "video"');
  });
});

describe("getAliasesForCategory", () => {
  it("returns presentation aliases", () => {
    const aliases = getAliasesForCategory("presentation");
    expect(aliases).toContain("pptx");
    expect(aliases).toContain("powerpoint");
    expect(aliases).toContain("slides");
    expect(aliases).toContain("html");
    expect(aliases).toContain("pdf");
  });

  it("returns document aliases", () => {
    const aliases = getAliasesForCategory("document");
    expect(aliases).toContain("docx");
    expect(aliases).toContain("word");
    expect(aliases).toContain("doc");
  });

  it("returns transcript aliases", () => {
    const aliases = getAliasesForCategory("transcript");
    expect(aliases).toContain("vtt");
    expect(aliases).toContain("srt");
  });
});

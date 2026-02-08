import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";
import { isPptx } from "./utils/ooxml.js";

async function loadJSZip() {
  const JSZip = await import("jszip");
  return JSZip.default ?? JSZip;
}

/**
 * Extract text from an XML string by stripping all tags.
 * Handles <a:t> (text), <a:br/> (line break), and <a:p> (paragraph) elements.
 */
function extractTextFromXml(xml: string): string {
  // Extract paragraphs (<a:p> blocks)
  const paragraphs: string[] = [];
  const pRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g;
  let pMatch;
  while ((pMatch = pRegex.exec(xml)) !== null) {
    // Extract text runs within the paragraph
    const pContent = pMatch[1];
    const texts: string[] = [];
    const tRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      texts.push(tMatch[1]);
    }
    if (texts.length > 0) {
      paragraphs.push(texts.join(""));
    }
  }
  return paragraphs.join("\n");
}

interface SlideContent {
  number: number;
  title: string;
  body: string;
  notes: string;
}

export const pptxIngest: IngestConverter = {
  name: "pptx",
  extensions: [".pptx", ".ppt"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    return isPptx(input.buffer);
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const JSZip = await loadJSZip();
    const zip = await JSZip.loadAsync(input.buffer);

    // Find all slide files (sorted by number)
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0");
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0");
        return numA - numB;
      });

    const slides: SlideContent[] = [];

    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = await zip.files[slideFiles[i]].async("text");

      // Try to extract title (usually the first shape or <p:sp> with <p:ph type="title">)
      let title = "";
      const titleMatch = slideXml.match(
        /<p:sp>[\s\S]*?<p:ph[^>]*type="(title|ctrTitle)"[\s\S]*?<p:txBody>([\s\S]*?)<\/p:txBody>/,
      );
      if (titleMatch) {
        title = extractTextFromXml(titleMatch[2]);
      }

      // Extract body text (all text from the slide)
      const bodyParts: string[] = [];
      const txBodyRegex = /<p:txBody>([\s\S]*?)<\/p:txBody>/g;
      let txMatch;
      while ((txMatch = txBodyRegex.exec(slideXml)) !== null) {
        const text = extractTextFromXml(txMatch[1]);
        if (text.trim() && text.trim() !== title.trim()) {
          bodyParts.push(text);
        }
      }

      // Try to load speaker notes
      let notes = "";
      const noteFile = `ppt/notesSlides/notesSlide${i + 1}.xml`;
      if (zip.files[noteFile]) {
        const notesXml = await zip.files[noteFile].async("text");
        const notesTexts: string[] = [];
        const noteBodyRegex = /<p:txBody>([\s\S]*?)<\/p:txBody>/g;
        let noteMatch;
        while ((noteMatch = noteBodyRegex.exec(notesXml)) !== null) {
          const text = extractTextFromXml(noteMatch[1]);
          // Filter out slide number placeholder text
          if (text.trim() && !/^\d+$/.test(text.trim())) {
            notesTexts.push(text);
          }
        }
        notes = notesTexts.join("\n");
      }

      slides.push({
        number: i + 1,
        title: title.trim(),
        body: bodyParts.join("\n\n"),
        notes: notes.trim(),
      });
    }

    // Build markdown
    const sections: string[] = [];
    for (const slide of slides) {
      const heading = slide.title || `Slide ${slide.number}`;
      let section = `## ${heading}\n`;

      if (slide.body) {
        section += `\n${slide.body}\n`;
      }

      if (slide.notes) {
        section += `\n> **Speaker Notes:** ${slide.notes}\n`;
      }

      sections.push(section);
    }

    const markdown = sections.join("\n---\n\n");

    return {
      markdown,
      metadata: {
        slideCount: slides.length,
      },
    };
  },
};

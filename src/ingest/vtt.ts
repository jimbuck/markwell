/**
 * Shared Transcript Markdown Format
 * ==================================
 * Both VTT and SRT ingest converters produce this format.
 * The transcript export converter (task 1000) parses it back.
 *
 * Format:
 *   ## Transcript
 *
 *   **[HH:MM:SS.mmm --> HH:MM:SS.mmm]** Speaker Name
 *   Cue text goes here.
 *
 *   **[HH:MM:SS.mmm --> HH:MM:SS.mmm]**
 *   Cue text without a speaker label.
 *
 * Notes:
 * - Each cue is a block separated by blank lines
 * - Timestamp line is bold, followed by optional speaker name
 * - VTT uses period for milliseconds: 00:00:01.000
 * - SRT uses comma for milliseconds in source but we normalize to period in Markdown
 * - Speaker labels come from VTT <v> tags; SRT has no native speaker support
 */

import type {
  IngestConverter,
  CanProcessInput,
  IngestInput,
  IngestOutput,
} from "../core/types.js";

interface Cue {
  startTime: string;
  endTime: string;
  speaker?: string;
  text: string;
}

function parseVttTimestamp(line: string): { start: string; end: string } | null {
  const match = line.match(
    /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/,
  );
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function parseVttContent(content: string): Cue[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const cues: Cue[] = [];

  let i = 0;

  // Skip WEBVTT header and any metadata
  while (i < lines.length && !lines[i].includes("-->")) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Try to parse timestamp
    const ts = parseVttTimestamp(line);
    if (!ts) {
      i++;
      continue;
    }

    i++;

    // Collect cue text lines until blank line or next timestamp
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      const textLine = lines[i].trim();
      if (parseVttTimestamp(textLine)) break;
      textLines.push(textLine);
      i++;
    }

    let text = textLines.join("\n");
    let speaker: string | undefined;

    // Extract speaker from <v> tag: <v Speaker Name>text</v>
    const voiceMatch = text.match(/^<v\s+([^>]+)>([\s\S]*?)(?:<\/v>)?$/);
    if (voiceMatch) {
      speaker = voiceMatch[1].trim();
      text = voiceMatch[2].trim();
    }

    // Strip any remaining HTML-like tags
    text = text.replace(/<[^>]+>/g, "");

    if (text.trim()) {
      cues.push({
        startTime: ts.start,
        endTime: ts.end,
        speaker,
        text: text.trim(),
      });
    }

    // Skip blank lines
    while (i < lines.length && lines[i].trim() === "") {
      i++;
    }
  }

  return cues;
}

function cuesToMarkdown(cues: Cue[]): string {
  const sections: string[] = ["## Transcript", ""];

  for (const cue of cues) {
    const timestamp = `**[${cue.startTime} --> ${cue.endTime}]**`;
    if (cue.speaker) {
      sections.push(`${timestamp} ${cue.speaker}`);
    } else {
      sections.push(timestamp);
    }
    sections.push(cue.text);
    sections.push("");
  }

  return sections.join("\n");
}

export const vttIngest: IngestConverter = {
  name: "vtt",
  extensions: [".vtt"],

  async canProcess(input: CanProcessInput): Promise<boolean> {
    return input.head.trimStart().startsWith("WEBVTT");
  },

  async ingest(input: IngestInput): Promise<IngestOutput> {
    const content = input.buffer.toString("utf-8");
    const cues = parseVttContent(content);
    const markdown = cuesToMarkdown(cues);

    return {
      markdown,
      metadata: {
        cueCount: cues.length,
      },
    };
  },
};

// Re-export for SRT converter to use the same format
export { cuesToMarkdown, type Cue };

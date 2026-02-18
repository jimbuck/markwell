import type {
  ExportConverter,
  ExportInput,
  ExportOutput,
  ResolvedTheme,
} from "../core/types.js";

interface Cue {
  startTime: string;
  endTime: string;
  speaker?: string;
  text: string;
}

/**
 * Parse the shared transcript Markdown format back into cue objects.
 *
 * Expected format:
 *   ## Transcript
 *
 *   **[HH:MM:SS.mmm --> HH:MM:SS.mmm]** Speaker Name
 *   Cue text goes here.
 *
 *   **[HH:MM:SS.mmm --> HH:MM:SS.mmm]**
 *   Cue text without a speaker label.
 */
function parseTranscriptMarkdown(content: string): Cue[] {
  const cues: Cue[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Match timestamp line: **[HH:MM:SS.mmm --> HH:MM:SS.mmm]** Optional Speaker
    const tsMatch = line.match(
      /\*\*\[(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\]\*\*\s*(.*)/,
    );

    if (tsMatch) {
      const startTime = tsMatch[1];
      const endTime = tsMatch[2];
      const speaker = tsMatch[3].trim() || undefined;

      i++;

      // Collect text lines until blank line or next timestamp
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        const nextLine = lines[i];
        // Check if this is a new timestamp line
        if (nextLine.match(/\*\*\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->/)) break;
        textLines.push(nextLine);
        i++;
      }

      const text = textLines.join("\n").trim();
      if (text) {
        cues.push({ startTime, endTime, speaker, text });
      }
    } else {
      i++;
    }
  }

  return cues;
}

function formatVtt(cues: Cue[], theme: ResolvedTheme): string {
  const includeSpeakers =
    (theme.transcript?.speakerLabels as boolean) ?? true;
  const lines: string[] = ["WEBVTT", ""];

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    // Cue identifier (optional in VTT)
    lines.push(`${i + 1}`);
    // Timestamp line
    lines.push(`${cue.startTime} --> ${cue.endTime}`);
    // Text with optional speaker
    if (includeSpeakers && cue.speaker) {
      lines.push(`<v ${cue.speaker}>${cue.text}</v>`);
    } else {
      lines.push(cue.text);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatSrt(cues: Cue[]): string {
  const lines: string[] = [];

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    // Sequence number
    lines.push(`${i + 1}`);
    // Timestamp line — SRT uses comma for milliseconds
    const start = cue.startTime.replace(".", ",");
    const end = cue.endTime.replace(".", ",");
    lines.push(`${start} --> ${end}`);
    // Text (no speaker labels in SRT)
    lines.push(cue.text);
    lines.push("");
  }

  return lines.join("\n");
}

export const transcriptExport: ExportConverter = {
  name: "transcript",
  category: "transcript",
  formats: [
    {
      extension: ".vtt",
      mimeType: "text/vtt",
      label: "WebVTT",
    },
    {
      extension: ".srt",
      mimeType: "application/x-subrip",
      label: "SubRip",
    },
  ],

  async export(input: ExportInput): Promise<ExportOutput> {
    const content = input.files[0]?.content ?? "";
    const cues = parseTranscriptMarkdown(content);
    const theme = input.theme;

    if (input.format === ".vtt") {
      const vtt = formatVtt(cues, theme);
      return {
        buffer: Buffer.from(vtt, "utf-8"),
        mimeType: "text/vtt",
        extension: ".vtt",
      };
    }

    if (input.format === ".srt") {
      const srt = formatSrt(cues);
      return {
        buffer: Buffer.from(srt, "utf-8"),
        mimeType: "application/x-subrip",
        extension: ".srt",
      };
    }

    throw new Error(`Unsupported transcript format: ${input.format}`);
  },
};

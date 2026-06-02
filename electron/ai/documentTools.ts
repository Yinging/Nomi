import { tool } from "ai";
import { z } from "zod";

/**
 * Zod schemas for the creation-area document tools the LLM is allowed to call.
 *
 * Mirrors the canvas tools design (see canvasTools.ts): we declare schemas only
 * and deliberately omit `execute`. The actual mutation happens in the renderer
 * (via `CreationDocumentTools` on the tiptap editor) once the user confirms; the
 * main process emits the tool-call to the UI and feeds the decision back to the
 * model as the tool result.
 *
 * Read tools (read_full_text / read_selection) are auto-executed by the renderer
 * without a confirmation card; write tools require explicit user approval.
 */

export const documentToolNames = [
  "read_full_text",
  "read_selection",
  "insert_at_cursor",
  "replace_selection",
  "append_to_end",
] as const;
export type DocumentToolName = (typeof documentToolNames)[number];

const contentParam = z.object({
  content: z.string().min(1).describe("The exact text to write into the document. Markdown is supported."),
});

export const documentTools = {
  read_full_text: tool({
    description:
      "Read the full plain text of the user's current creation document. Call this when you need the existing draft as context before writing or rewriting.",
    parameters: z.object({}),
  }),
  read_selection: tool({
    description:
      "Read the text the user has currently selected in the editor. Returns an empty string if nothing is selected.",
    parameters: z.object({}),
  }),
  insert_at_cursor: tool({
    description:
      "Insert text at the current cursor position. Use for continuations or additions that belong where the user is working. Requires user confirmation.",
    parameters: contentParam,
  }),
  replace_selection: tool({
    description:
      "Replace the user's current selection with new text. Use for rewrites/polish of a selected passage. Requires user confirmation.",
    parameters: contentParam,
  }),
  append_to_end: tool({
    description:
      "Append text to the end of the document. Use when delivering a complete result that should sit after the existing draft. Requires user confirmation.",
    parameters: contentParam,
  }),
} as const;

export type DocumentTools = typeof documentTools;

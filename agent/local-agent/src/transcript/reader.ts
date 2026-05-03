import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import * as v from "valibot";
import { TranscriptRowSchema, type TranscriptRow } from "../domain/schemas.ts";

export type TranscriptCursor = {
  transcriptPath: string;
  byteOffset: number;
  lineNo: number;
  seenEventIds: Set<string>;
};

export type ParsedTranscriptRow = {
  lineNo: number;
  byteOffset: number;
  row: TranscriptRow;
};

export class TranscriptCursorStore {
  private readonly cursors = new Map<string, TranscriptCursor>();

  get(sessionId: string, transcriptPath: string): TranscriptCursor {
    const existing = this.cursors.get(sessionId);
    if (existing?.transcriptPath === transcriptPath) {
      return existing;
    }

    const nextCursor: TranscriptCursor = {
      transcriptPath,
      byteOffset: 0,
      lineNo: 0,
      seenEventIds: new Set<string>(),
    };
    this.cursors.set(sessionId, nextCursor);
    return nextCursor;
  }
}

export function readTranscriptIncrement(cursor: TranscriptCursor): ParsedTranscriptRow[] {
  const { transcriptPath, byteOffset } = cursor;
  if (!existsSync(transcriptPath)) {
    return [];
  }

  const stats = statSync(transcriptPath);
  if (!stats.isFile() || stats.size <= byteOffset) {
    return [];
  }

  const fd = openSync(transcriptPath, "r");
  try {
    return parseTranscriptChunk(cursor, readChunk(fd, byteOffset, stats.size - byteOffset));
  } finally {
    closeSync(fd);
  }
}

function readChunk(fd: number, offset: number, bytesToRead: number): string {
  const buffer = Buffer.alloc(bytesToRead);
  const bytesRead = readSync(fd, buffer, 0, bytesToRead, offset);
  return buffer.subarray(0, bytesRead).toString("utf8");
}

function parseTranscriptChunk(cursor: TranscriptCursor, text: string): ParsedTranscriptRow[] {
  const completeLines = text.split("\n");
  completeLines.pop();
  const state = completeLines.reduce(
    (current, line) => appendParsedLine(current, line),
    {
      parsed: [] as ParsedTranscriptRow[],
      byteOffset: cursor.byteOffset,
      lineNo: cursor.lineNo,
      stopped: false,
    },
  );

  cursor.byteOffset = state.byteOffset;
  cursor.lineNo = state.lineNo;
  return state.parsed;
}

type ParseState = {
  parsed: ParsedTranscriptRow[];
  byteOffset: number;
  lineNo: number;
  stopped: boolean;
};

function appendParsedLine(state: ParseState, line: string): ParseState {
  if (state.stopped) {
    return state;
  }

  const nextState = advanceState(state, line);
  if (!line.trim()) {
    return nextState;
  }

  const row = parseTranscriptLine(line);
  return row
    ? { ...nextState, parsed: [...state.parsed, { lineNo: state.lineNo + 1, byteOffset: state.byteOffset, row }] }
    : { ...state, stopped: true };
}

function advanceState({ parsed, byteOffset, lineNo }: ParseState, line: string): ParseState {
  return {
    parsed,
    byteOffset: byteOffset + Buffer.byteLength(`${line}\n`),
    lineNo: lineNo + 1,
    stopped: false,
  };
}

function parseTranscriptLine(line: string): TranscriptRow | null {
  try {
    return v.parse(TranscriptRowSchema, JSON.parse(line));
  } catch {
    return null;
  }
}

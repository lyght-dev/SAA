import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { isArray, isNumber, isPlainObject, isString } from "es-toolkit/compat";
import { type TranscriptCursor } from "./reader.ts";

type CursorSnapshot = {
  transcriptPath: string;
  byteOffset: number;
  lineNo: number;
  seenEventIds: string[];
};

type CursorSnapshotStore = Record<string, CursorSnapshot>;

const isCursorSnapshot = (value: unknown): value is CursorSnapshot => {
  if (!isPlainObject(value)) {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  const { transcriptPath, byteOffset, lineNo, seenEventIds } = snapshot;

  return (
    isString(transcriptPath) &&
    isNumber(byteOffset) &&
    isNumber(lineNo) &&
    isArray(seenEventIds)
  );
};

export class FileTranscriptCursorStore {
  private readonly snapshots: CursorSnapshotStore;
  private readonly cursorPath: string;

  constructor(cursorPath: string) {
    this.cursorPath = cursorPath;
    this.snapshots = this.readSnapshots();
  }

  get(sessionId: string, transcriptPath: string): TranscriptCursor {
    const snapshot = this.snapshots[sessionId];
    if (snapshot?.transcriptPath !== transcriptPath) {
      return this.createCursor(sessionId, transcriptPath);
    }

    return {
      transcriptPath,
      byteOffset: snapshot.byteOffset,
      lineNo: snapshot.lineNo,
      seenEventIds: new Set(snapshot.seenEventIds),
    };
  }

  save(sessionId: string, cursor: TranscriptCursor): void {
    this.snapshots[sessionId] = {
      transcriptPath: cursor.transcriptPath,
      byteOffset: cursor.byteOffset,
      lineNo: cursor.lineNo,
      seenEventIds: [...cursor.seenEventIds],
    };

    mkdirSync(dirname(this.cursorPath), { recursive: true });
    writeFileSync(this.cursorPath, `${JSON.stringify(this.snapshots, null, 2)}\n`, "utf8");
  }

  private createCursor(sessionId: string, transcriptPath: string): TranscriptCursor {
    const cursor = {
      transcriptPath,
      byteOffset: 0,
      lineNo: 0,
      seenEventIds: new Set<string>(),
    };
    this.save(sessionId, cursor);
    return cursor;
  }

  private readSnapshots(): CursorSnapshotStore {
    if (!existsSync(this.cursorPath)) {
      return {};
    }

    try {
      const parsed = JSON.parse(readFileSync(this.cursorPath, "utf8"));
      if (!isPlainObject(parsed)) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, CursorSnapshot] => isCursorSnapshot(entry[1])),
      );
    } catch {
      return {};
    }
  }
}

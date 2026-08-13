import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { MockExamSet } from "@/lib/mock-exam-types";
import { CONTENT_DOMAINS } from "@/lib/question-types";

function isMockExamSet(value: unknown): value is MockExamSet {
  if (!value || typeof value !== "object") return false;

  const set = value as Partial<MockExamSet>;
  if (
    set.schemaVersion !== 1 ||
    !Number.isInteger(set.setNumber) ||
    !Number.isInteger(set.questionCount) ||
    !Array.isArray(set.items) ||
    !Array.isArray(set.contentDomains) ||
    set.items.length !== set.questionCount
  ) {
    return false;
  }

  const itemNumbers = new Set<number>();
  const questionIds = new Set<string>();
  const validItems = set.items.every((item) => {
    if (
      !Number.isInteger(item.itemNumber) ||
      !/^Q\d{4}$/.test(item.questionId) ||
      !Number.isInteger(item.questionNumber) ||
      !["D1", "D2", "D3", "D4"].includes(item.contentDomainCode) ||
      itemNumbers.has(item.itemNumber) ||
      questionIds.has(item.questionId)
    ) {
      return false;
    }

    itemNumbers.add(item.itemNumber);
    questionIds.add(item.questionId);
    return true;
  });

  return Boolean(
    validItems &&
      set.contentDomains.length === CONTENT_DOMAINS.length &&
      set.contentDomains.every((domain) => CONTENT_DOMAINS.includes(domain.name)),
  );
}

export async function getMockExamSets(): Promise<MockExamSet[]> {
  const directory = path.join(process.cwd(), "resources", "mock-exams");

  try {
    const files = (await fs.readdir(directory))
      .filter((file) => /^set-\d+\.json$/.test(file))
      .sort();

    const loaded = await Promise.all(
      files.map(async (file) => {
        const source = await fs.readFile(path.join(directory, file), "utf8");
        return { file, value: JSON.parse(source) as unknown };
      }),
    );

    return loaded
      .flatMap(({ file, value }) => {
        if (isMockExamSet(value)) return [value];
        console.warn(`Mock exam set ignored: ${file} has an invalid schema`);
        return [];
      })
      .sort((a, b) => a.setNumber - b.setNumber);
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined;
    if (code !== "ENOENT") console.warn("Mock exam sets could not be loaded", error);
    return [];
  }
}

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { CONTENT_DOMAINS, type ContentDomain, type Question } from "@/lib/question-types";

type RawQuestion = {
  questionNumber?: number;
  question?: string;
  choices?: Record<string, string>;
  answer?: string;
  contentDomain?: string;
  contentTask?: string;
  awsServices?: string[];
};

function isCompleteQuestion(raw: RawQuestion): raw is Required<RawQuestion> {
  return Boolean(
    raw.questionNumber &&
      raw.question &&
      raw.choices &&
      raw.answer &&
      raw.contentTask &&
      raw.contentDomain &&
      CONTENT_DOMAINS.includes(raw.contentDomain as ContentDomain),
  );
}

export async function getQuestions(): Promise<Question[]> {
  const questionsDirectory = path.join(process.cwd(), "questions");
  const files = (await fs.readdir(questionsDirectory))
    .filter((file) => /^Q\d{4}\.json$/.test(file))
    .sort();

  const loaded = await Promise.all(
    files.map(async (file) => {
      const source = await fs.readFile(path.join(questionsDirectory, file), "utf8");
      return { file, raw: JSON.parse(source) as RawQuestion };
    }),
  );

  return loaded
    .flatMap(({ file, raw }): Question[] => {
      if (!isCompleteQuestion(raw)) return [];

      return [{
        id: file.replace(".json", ""),
        questionNumber: raw.questionNumber,
        question: raw.question,
        choices: Object.entries(raw.choices).map(([key, text]) => ({ key, text })),
        answer: raw.answer,
        contentDomain: raw.contentDomain as ContentDomain,
        contentTask: raw.contentTask,
        awsServices: raw.awsServices ?? [],
      }];
    })
    .sort((a, b) => a.questionNumber - b.questionNumber);
}

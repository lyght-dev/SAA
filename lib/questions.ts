import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  CONTENT_DOMAINS,
  type ChoiceEvaluation,
  type ContentDomain,
  type Question,
  type QuestionExplanation,
} from "@/lib/question-types";
import { createClient } from "@/utils/supabase/server";

type RawQuestion = {
  questionNumber?: number;
  question?: string;
  choices?: Record<string, string>;
  answer?: string | string[];
  contentDomain?: string;
  contentTask?: string;
  awsServices?: string[];
  explanation?: QuestionExplanation;
  choiceEvaluations?: Record<string, ChoiceEvaluation>;
};

function hasCompleteExplanation(raw: RawQuestion): boolean {
  const explanation = raw.explanation;
  const choiceKeys = Object.keys(raw.choices ?? {});
  const answers = Array.isArray(raw.answer) ? raw.answer : raw.answer ? [raw.answer] : [];

  return Boolean(
    explanation?.requirementsAnalysis?.trim() &&
      explanation.awsServicesAnalysis?.trim() &&
      explanation.choicesAnalysis?.trim() &&
      raw.choiceEvaluations &&
      choiceKeys.length > 0 &&
      choiceKeys.every((key) => {
        const evaluation = raw.choiceEvaluations?.[key];
        return (
          typeof evaluation?.isCorrect === "boolean" &&
          evaluation.isCorrect === answers.includes(key) &&
          Boolean(evaluation.explanation?.trim())
        );
      }),
  );
}

function isCompleteQuestion(raw: RawQuestion): raw is Required<RawQuestion> {
  return Boolean(
    raw.questionNumber &&
      raw.question &&
      raw.choices &&
      raw.answer &&
      raw.contentTask &&
      raw.contentDomain &&
      CONTENT_DOMAINS.includes(raw.contentDomain as ContentDomain) &&
      hasCompleteExplanation(raw),
  );
}

type QuestionRow = {
  id: string;
  question_number: number;
  question: string;
  choices: Record<string, string>;
  answers: string[];
  content_domain: string;
  content_task: string;
  aws_services: string[];
  explanation: QuestionExplanation;
  choice_evaluations: Record<string, ChoiceEvaluation>;
};

function mapQuestionRow(row: QuestionRow): Question | null {
  const raw: RawQuestion = {
    questionNumber: row.question_number,
    question: row.question,
    choices: row.choices,
    answer: row.answers,
    contentDomain: row.content_domain,
    contentTask: row.content_task,
    awsServices: row.aws_services,
    explanation: row.explanation,
    choiceEvaluations: row.choice_evaluations,
  };

  if (!isCompleteQuestion(raw)) return null;

  return {
    id: row.id,
    questionNumber: raw.questionNumber,
    question: raw.question,
    choices: Object.entries(raw.choices).map(([key, text]) => ({ key, text })),
    answer: Array.isArray(raw.answer) ? raw.answer : [raw.answer],
    contentDomain: raw.contentDomain as ContentDomain,
    contentTask: raw.contentTask,
    awsServices: raw.awsServices ?? [],
    explanation: raw.explanation,
    choiceEvaluations: raw.choiceEvaluations,
  };
}

async function getQuestionsFromFiles(): Promise<Question[]> {
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
        answer: Array.isArray(raw.answer) ? raw.answer : [raw.answer],
        contentDomain: raw.contentDomain as ContentDomain,
        contentTask: raw.contentTask,
        awsServices: raw.awsServices ?? [],
        explanation: raw.explanation,
        choiceEvaluations: raw.choiceEvaluations,
      }];
    })
    .sort((a, b) => a.questionNumber - b.questionNumber);
}

export async function getQuestions(): Promise<Question[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, question_number, question, choices, answers, content_domain, content_task, aws_services, explanation, choice_evaluations",
    )
    .order("question_number");

  if (!error && data?.length === 100) {
    const questions = (data as QuestionRow[])
      .map(mapQuestionRow)
      .filter((question): question is Question => question !== null);

    if (questions.length === 100) return questions;
  }

  console.warn(
    error
      ? `Supabase questions fallback: ${error.message}`
      : `Supabase questions fallback: expected 100 valid rows, received ${data?.length ?? 0}`,
  );
  return getQuestionsFromFiles();
}

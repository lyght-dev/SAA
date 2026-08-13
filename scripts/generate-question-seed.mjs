import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = process.argv[2];

if (!outputPath) {
  throw new Error("Usage: node scripts/generate-question-seed.mjs <output.sql>");
}

const questionsDirectory = path.join(process.cwd(), "questions");
const files = (await readdir(questionsDirectory))
  .filter((file) => /^Q(?:00(?:0[1-9]|[1-9][0-9])|0100)\.json$/.test(file))
  .sort();

if (files.length !== 100) {
  throw new Error(`Expected 100 question files, found ${files.length}`);
}

const records = await Promise.all(
  files.map(async (file) => {
    const raw = JSON.parse(await readFile(path.join(questionsDirectory, file), "utf8"));

    return {
      id: file.replace(".json", ""),
      question_number: raw.questionNumber,
      question: raw.question,
      choices: raw.choices,
      answers: Array.isArray(raw.answer) ? raw.answer : [raw.answer],
      content_domain: raw.contentDomain,
      content_task: raw.contentTask,
      aws_services: raw.awsServices ?? [],
      explanation: raw.explanation,
      choice_evaluations: raw.choiceEvaluations,
    };
  }),
);

const payload = JSON.stringify(records).replaceAll("'", "''");
const sql = `insert into public.questions (
  id,
  question_number,
  question,
  choices,
  answers,
  content_domain,
  content_task,
  aws_services,
  explanation,
  choice_evaluations
)
select
  record.id,
  record.question_number,
  record.question,
  record.choices,
  record.answers,
  record.content_domain,
  record.content_task,
  record.aws_services,
  record.explanation,
  record.choice_evaluations
from jsonb_to_recordset('${payload}'::jsonb) as record(
  id text,
  question_number smallint,
  question text,
  choices jsonb,
  answers text[],
  content_domain text,
  content_task text,
  aws_services text[],
  explanation jsonb,
  choice_evaluations jsonb
)
on conflict (id) do update set
  question_number = excluded.question_number,
  question = excluded.question,
  choices = excluded.choices,
  answers = excluded.answers,
  content_domain = excluded.content_domain,
  content_task = excluded.content_task,
  aws_services = excluded.aws_services,
  explanation = excluded.explanation,
  choice_evaluations = excluded.choice_evaluations,
  updated_at = now();
`;

await writeFile(outputPath, sql);
console.log(`Generated ${records.length} question rows in ${outputPath}`);

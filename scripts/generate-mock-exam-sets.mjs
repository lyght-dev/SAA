#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DOMAIN_CONFIG = [
  { code: "D1", name: "보안 아키텍처 설계", weightPercent: 30 },
  { code: "D2", name: "복원력을 갖춘 아키텍처 설계", weightPercent: 26 },
  { code: "D3", name: "고성능 아키텍처 설계", weightPercent: 24 },
  { code: "D4", name: "비용에 최적화된 아키텍처 설계", weightPercent: 20 },
];

const DEFAULTS = {
  startSet: 1,
  sets: 1,
  questionCount: 65,
  maxQuestion: 725,
  questionsDirectory: "questions",
  outputDirectory: "resources/mock-exams",
};

function usage() {
  return `Usage: npm run generate:mock-exams -- [options]

Options:
  --start-set <number>       First set number (default: ${DEFAULTS.startSet})
  --sets <number>           Number of sets to generate (default: ${DEFAULTS.sets})
  --question-count <number> Questions per set (default: ${DEFAULTS.questionCount})
  --max-question <number>   Highest source question number (default: ${DEFAULTS.maxQuestion})
  --seed <hex>              Batch seed (default: random 64-bit hex)
  --questions-dir <path>    Source directory (default: ${DEFAULTS.questionsDirectory})
  --output-dir <path>       Destination directory (default: ${DEFAULTS.outputDirectory})
  --force                   Replace target set files if they already exist
  --help                    Show this help

Examples:
  npm run generate:mock-exams -- --start-set 1 --sets 3
  npm run generate:mock-exams -- --start-set 4 --sets 1 --seed a1b2c3d4
`;
}

function positiveInteger(value, option) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${option} must be a positive integer.`);
  }
  return parsed;
}

function parseArgs(argv) {
  const options = {
    ...DEFAULTS,
    seed: randomBytes(8).toString("hex"),
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--force") {
      options.force = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }
    index += 1;

    switch (argument) {
      case "--start-set":
        options.startSet = positiveInteger(value, argument);
        break;
      case "--sets":
        options.sets = positiveInteger(value, argument);
        break;
      case "--question-count":
        options.questionCount = positiveInteger(value, argument);
        break;
      case "--max-question":
        options.maxQuestion = positiveInteger(value, argument);
        break;
      case "--seed":
        if (!/^[0-9a-f]{1,16}$/i.test(value)) {
          throw new Error("--seed must contain 1 to 16 hexadecimal characters.");
        }
        options.seed = value.toLowerCase().padStart(16, "0");
        break;
      case "--questions-dir":
        options.questionsDirectory = value;
        break;
      case "--output-dir":
        options.outputDirectory = value;
        break;
      default:
        throw new Error(`Unknown option: ${argument}`);
    }
  }

  return options;
}

function allocateByLargestRemainder(questionCount) {
  const allocations = DOMAIN_CONFIG.map((domain, index) => {
    const exact = (questionCount * domain.weightPercent) / 100;
    return { ...domain, index, questionCount: Math.floor(exact), remainder: exact % 1 };
  });
  let remaining = questionCount - allocations.reduce((sum, item) => sum + item.questionCount, 0);

  for (const allocation of [...allocations].sort(
    (left, right) => right.remainder - left.remainder || left.index - right.index,
  )) {
    if (remaining === 0) break;
    allocation.questionCount += 1;
    remaining -= 1;
  }

  return allocations.map(({ index: _index, remainder: _remainder, ...allocation }) => allocation);
}

function createRandom(seed) {
  const mask = (1n << 64n) - 1n;
  let state = BigInt(`0x${seed}`);
  return () => {
    state = (state * 6364136223846793005n + 1442695040888963407n) & mask;
    return Number(state >> 11n) / 9007199254740992;
  };
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function seedForSet(batchSeed, setNumber) {
  return createHash("sha256").update(`${batchSeed}:${setNumber}`).digest("hex").slice(0, 16);
}

function setFileName(setNumber) {
  return `set-${String(setNumber).padStart(2, "0")}.json`;
}

function hasCompleteExplanation(question) {
  const choices = question.choices && typeof question.choices === "object"
    ? Object.keys(question.choices)
    : [];
  const answers = Array.isArray(question.answer)
    ? question.answer
    : question.answer
      ? [question.answer]
      : [];
  const explanation = question.explanation;

  return Boolean(
    explanation?.requirementsAnalysis?.trim() &&
      explanation.awsServicesAnalysis?.trim() &&
      explanation.choicesAnalysis?.trim() &&
      question.choiceEvaluations &&
      choices.length > 0 &&
      answers.length > 0 &&
      choices.every((choice) => {
        const evaluation = question.choiceEvaluations[choice];
        return typeof evaluation?.isCorrect === "boolean" &&
          evaluation.isCorrect === answers.includes(choice) &&
          Boolean(evaluation.explanation?.trim());
      }),
  );
}

function validateQuestion(question, expectedNumber, file) {
  const errors = [];
  if (question.questionNumber !== expectedNumber) errors.push("questionNumber mismatch");
  if (!question.question?.trim()) errors.push("question is empty");
  if (!question.contentTask?.trim()) errors.push("contentTask is empty");
  if (!DOMAIN_CONFIG.some((domain) => domain.name === question.contentDomain)) {
    errors.push(`unknown contentDomain: ${question.contentDomain ?? "(empty)"}`);
  }
  if (!hasCompleteExplanation(question)) errors.push("explanation or choice evaluations are incomplete");
  return errors.length ? `${file}: ${errors.join(", ")}` : null;
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function readExistingQuestionIds(outputDirectory, targetNames) {
  let files;
  try {
    files = await readdir(outputDirectory);
  } catch (error) {
    if (error.code === "ENOENT") return new Set();
    throw error;
  }

  const reserved = new Set();
  for (const file of files.filter((name) => /^set-\d+\.json$/.test(name) && !targetNames.has(name))) {
    const existing = JSON.parse(await readFile(path.join(outputDirectory, file), "utf8"));
    if (!Array.isArray(existing.items)) {
      throw new Error(`Existing mock exam has no items array: ${file}`);
    }
    for (const item of existing.items) {
      if (typeof item.questionId !== "string") {
        throw new Error(`Existing mock exam has an invalid questionId: ${file}`);
      }
      reserved.add(item.questionId);
    }
  }
  return reserved;
}

async function loadQuestions(questionsDirectory, maxQuestion) {
  const files = await readdir(questionsDirectory);
  const fileByNumber = new Map();
  for (const file of files) {
    const match = /^Q(\d{4})\.json$/.exec(file);
    if (!match) continue;
    const number = Number(match[1]);
    if (number >= 1 && number <= maxQuestion) fileByNumber.set(number, file);
  }

  const missing = Array.from({ length: maxQuestion }, (_, index) => index + 1)
    .filter((number) => !fileByNumber.has(number));
  if (missing.length) {
    const preview = missing.slice(0, 12).map((number) => `Q${String(number).padStart(4, "0")}`).join(", ");
    throw new Error(`Missing ${missing.length} source question(s) through Q${String(maxQuestion).padStart(4, "0")}: ${preview}${missing.length > 12 ? ", ..." : ""}`);
  }

  const questions = [];
  const invalid = [];
  for (let number = 1; number <= maxQuestion; number += 1) {
    const file = fileByNumber.get(number);
    const raw = JSON.parse(await readFile(path.join(questionsDirectory, file), "utf8"));
    const validationError = validateQuestion(raw, number, file);
    if (validationError) invalid.push(validationError);
    questions.push({
      questionId: file.replace(".json", ""),
      questionNumber: number,
      contentDomain: raw.contentDomain,
    });
  }

  if (invalid.length) {
    throw new Error(`Found ${invalid.length} incomplete or invalid source question(s):\n${invalid.slice(0, 12).join("\n")}${invalid.length > 12 ? "\n..." : ""}`);
  }
  return questions;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repositoryRoot = process.cwd();
  const questionsDirectory = path.resolve(repositoryRoot, options.questionsDirectory);
  const outputDirectory = path.resolve(repositoryRoot, options.outputDirectory);
  const setNumbers = Array.from({ length: options.sets }, (_, index) => options.startSet + index);
  const targetNames = new Set(setNumbers.map(setFileName));
  const targetPaths = setNumbers.map((setNumber) => path.join(outputDirectory, setFileName(setNumber)));

  if (!options.force) {
    const collisions = [];
    for (const target of targetPaths) {
      if (await pathExists(target)) collisions.push(path.relative(repositoryRoot, target));
    }
    if (collisions.length) {
      throw new Error(`Target set file(s) already exist: ${collisions.join(", ")}. Use --force to replace them.`);
    }
  }

  const allocations = allocateByLargestRemainder(options.questionCount);
  const questions = await loadQuestions(questionsDirectory, options.maxQuestion);
  const reservedIds = await readExistingQuestionIds(outputDirectory, targetNames);
  const availableQuestions = questions.filter((question) => !reservedIds.has(question.questionId));
  const shortages = allocations.flatMap((allocation) => {
    const available = availableQuestions.filter(
      (question) => question.contentDomain === allocation.name,
    ).length;
    const required = allocation.questionCount * options.sets;
    return available < required ? [{ ...allocation, available, required }] : [];
  });

  if (shortages.length) {
    const details = shortages
      .map((item) => `${item.code} ${item.name}: required ${item.required}, available ${item.available}`)
      .join("\n");
    throw new Error(`Not enough unique questions to generate the requested sets:\n${details}`);
  }

  const poolByDomain = new Map(DOMAIN_CONFIG.map((domain) => [
    domain.name,
    availableQuestions.filter((question) => question.contentDomain === domain.name),
  ]));
  const outputs = [];

  for (const setNumber of setNumbers) {
    const setSeed = seedForSet(options.seed, setNumber);
    const random = createRandom(setSeed);
    const selected = [];

    for (const allocation of allocations) {
      const pool = poolByDomain.get(allocation.name);
      const domainSelection = shuffle(pool, random).slice(0, allocation.questionCount);
      const selectedIds = new Set(domainSelection.map((question) => question.questionId));
      poolByDomain.set(
        allocation.name,
        pool.filter((question) => !selectedIds.has(question.questionId)),
      );
      selected.push(...domainSelection);
    }

    const codeByDomain = new Map(DOMAIN_CONFIG.map((domain) => [domain.name, domain.code]));
    const items = shuffle(selected, random).map((question, index) => ({
      itemNumber: index + 1,
      questionId: question.questionId,
      questionNumber: question.questionNumber,
      contentDomainCode: codeByDomain.get(question.contentDomain),
    }));
    const mockExam = {
      schemaVersion: 1,
      setNumber,
      questionCount: options.questionCount,
      randomSeed: setSeed,
      randomAlgorithm: "lcg64-fisher-yates-v1",
      sourceQuestionRange: { from: 1, to: options.maxQuestion },
      contentDomains: allocations.map(({ code, name, weightPercent, questionCount }) => ({
        code,
        name,
        weightPercent,
        questionCount,
      })),
      sampling: {
        withoutReplacement: true,
        allocationMethod: "largest-remainder",
      },
      items,
    };
    outputs.push({
      target: path.join(outputDirectory, setFileName(setNumber)),
      contents: `${JSON.stringify(mockExam, null, 2)}\n`,
    });
  }

  await mkdir(outputDirectory, { recursive: true });
  for (const output of outputs) await writeFile(output.target, output.contents, "utf8");

  console.log(`Generated ${outputs.length} mock exam set(s), ${options.questionCount} questions each.`);
  console.log(`Batch seed: ${options.seed}`);
  for (const output of outputs) console.log(path.relative(repositoryRoot, output.target));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

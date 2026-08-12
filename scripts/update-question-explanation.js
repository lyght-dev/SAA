#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node scripts/update-question-explanation.js <question.json> \\
    --requirements-analysis <text> \\
    --aws-services-analysis <text> \\
    --choices-analysis <text> \\
    --choice-evaluation <choice> <text> [--choice-evaluation <choice> <text> ...]`);
}

function parseArguments(args) {
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(0);
  }

  const result = { questionPath: args[0], choiceEvaluations: {} };
  const options = {
    "--requirements-analysis": "requirementsAnalysis",
    "--aws-services-analysis": "awsServicesAnalysis",
    "--choices-analysis": "choicesAnalysis",
  };

  for (let index = 1; index < args.length;) {
    const option = args[index];

    if (option === "--choice-evaluation") {
      const choice = args[index + 1];
      const explanation = args[index + 2];
      if (!choice || choice.startsWith("--") || !explanation || explanation.startsWith("--")) {
        fail("--choice-evaluation requires a choice and explanation.");
      }
      if (result.choiceEvaluations[choice]) fail(`Duplicate choice evaluation: ${choice}`);
      result.choiceEvaluations[choice] = explanation.trim();
      index += 3;
      continue;
    }

    const key = options[option];
    const value = args[index + 1];
    if (!key) fail(`Unknown option: ${option}`);
    if (value === undefined || value.startsWith("--")) fail(`Missing value for ${option}`);
    result[key] = value.trim();
    index += 2;
  }

  if (!result.questionPath) fail("A question JSON path is required.");
  for (const key of Object.values(options)) {
    if (!result[key]) fail(`${key} is required and must not be empty.`);
  }

  return result;
}

function main() {
  const input = parseArguments(process.argv.slice(2));
  const questionPath = path.resolve(process.cwd(), input.questionPath);

  let question;
  try {
    question = JSON.parse(fs.readFileSync(questionPath, "utf8"));
  } catch (error) {
    fail(`Could not read valid JSON from ${questionPath}: ${error.message}`);
  }

  if (!question.question || !question.choices || !question.answer) {
    fail("The question must contain question, choices, and answer fields.");
  }

  const choices = Object.keys(question.choices);
  const evaluatedChoices = Object.keys(input.choiceEvaluations);
  const missingChoices = choices.filter((choice) => !evaluatedChoices.includes(choice));
  const unknownChoices = evaluatedChoices.filter((choice) => !choices.includes(choice));
  if (missingChoices.length > 0) fail(`Missing choice evaluations: ${missingChoices.join(", ")}`);
  if (unknownChoices.length > 0) fail(`Unknown choices in evaluations: ${unknownChoices.join(", ")}`);

  const answers = new Set(Array.isArray(question.answer) ? question.answer : [question.answer]);

  question.explanation = {
    requirementsAnalysis: input.requirementsAnalysis,
    awsServicesAnalysis: input.awsServicesAnalysis,
    choicesAnalysis: input.choicesAnalysis,
  };
  question.choiceEvaluations = Object.fromEntries(
    choices.map((choice) => [
      choice,
      {
        isCorrect: answers.has(choice),
        explanation: input.choiceEvaluations[choice],
      },
    ]),
  );

  fs.writeFileSync(questionPath, `${JSON.stringify(question, null, 2)}\n`);
  console.log(`Updated ${path.relative(process.cwd(), questionPath)}`);
}

main();

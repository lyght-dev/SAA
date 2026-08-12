#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repositoryRoot = path.resolve(__dirname, "..");
const enumPath = path.join(repositoryRoot, "enums", "question-metadata.json");

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node scripts/update-question-metadata.js <question.json> \\
    --answer <choice> [--answer <choice> ...] \\
    --content-domain <domain> \\
    --content-task <task> \\
    --aws-service <service> [--aws-service <service> ...]`);
}

function parseArguments(args) {
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(0);
  }

  const result = {
    questionPath: args[0],
    answers: [],
    awsServices: [],
  };

  for (let index = 1; index < args.length; index += 1) {
    const option = args[index];
    const value = args[index + 1];

    if (!["--answer", "--content-domain", "--content-task", "--aws-service"].includes(option)) {
      fail(`Unknown option: ${option}`);
    }
    if (value === undefined || value.startsWith("--")) {
      fail(`Missing value for ${option}`);
    }

    if (option === "--answer") {
      result.answers.push(value);
    } else if (option === "--content-domain") {
      result.contentDomain = value;
    } else if (option === "--content-task") {
      result.contentTask = value;
    } else {
      result.awsServices.push(value);
    }
    index += 1;
  }

  if (!result.questionPath) fail("A question JSON path is required.");
  if (result.answers.length === 0) fail("At least one --answer is required.");
  if (!result.contentDomain) fail("--content-domain is required.");
  if (!result.contentTask) fail("--content-task is required.");
  if (result.awsServices.length === 0) fail("At least one --aws-service is required.");

  return result;
}

function assertAllowed(value, allowedValues, label) {
  if (!allowedValues.includes(value)) {
    fail(`${label} must be one of:\n  - ${allowedValues.join("\n  - ")}`);
  }
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

  const answers = [...new Set(input.answers)];
  if (!question.choices || answers.some((answer) => !Object.hasOwn(question.choices, answer))) {
    fail(`Every answer must match an existing choice: ${Object.keys(question.choices ?? {}).join(", ")}`);
  }

  let metadataEnums;
  try {
    metadataEnums = JSON.parse(fs.readFileSync(enumPath, "utf8"));
  } catch (error) {
    fail(`Could not read metadata enums from ${enumPath}: ${error.message}`);
  }

  const contentDomain = metadataEnums.contentDomains.find(
    (domain) => domain.name === input.contentDomain,
  );
  assertAllowed(
    input.contentDomain,
    metadataEnums.contentDomains.map((domain) => domain.name),
    "contentDomain",
  );
  assertAllowed(input.contentTask, contentDomain.tasks, `contentTask for ${input.contentDomain}`);
  for (const awsService of input.awsServices) {
    assertAllowed(awsService, metadataEnums.awsServices, "awsService");
  }

  delete question.answer;
  delete question.contentDomain;
  delete question.contentTask;
  delete question.awsServices;

  question.answer = answers.length === 1 ? answers[0] : answers;
  question.contentDomain = input.contentDomain;
  question.contentTask = input.contentTask;
  question.awsServices = [...new Set(input.awsServices)];

  fs.writeFileSync(questionPath, `${JSON.stringify(question, null, 2)}\n`);
  console.log(`Updated ${path.relative(process.cwd(), questionPath)}`);
}

main();

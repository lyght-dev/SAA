#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repositoryRoot = path.resolve(__dirname, "..");
const contentDomainPath = path.join(repositoryRoot, "content_domain.md");
const awsServicePath = path.join(repositoryRoot, "aws_service.md");
const enumPath = path.join(repositoryRoot, "enums", "question-metadata.json");

function readContentDomains(markdown) {
  const domains = [];
  let currentDomain;

  for (const line of markdown.split(/\r?\n/)) {
    const domainMatch = line.match(/^# 콘텐츠 도메인 \d+: (.+)$/);
    if (domainMatch) {
      currentDomain = { name: domainMatch[1].trim(), tasks: [] };
      domains.push(currentDomain);
      continue;
    }

    const taskMatch = line.match(/^## 작업 \d+\.\d+: (.+)$/);
    if (taskMatch && currentDomain) {
      currentDomain.tasks.push(taskMatch[1].trim());
    }
  }

  return domains;
}

function readAwsServices(markdown) {
  const heading = "# 범위 내 AWS 서비스";
  const sectionStart = markdown.indexOf(heading);
  if (sectionStart === -1) {
    throw new Error(`${heading} section was not found in aws_service.md.`);
  }

  return [
    ...new Set(
      [...markdown.slice(sectionStart + heading.length).matchAll(/^\+ ([^\r\n]+)$/gm)]
        .map((match) => match[1].trim())
        .filter((value) => !value.startsWith("[")),
    ),
  ];
}

const metadataEnums = {
  contentDomains: readContentDomains(fs.readFileSync(contentDomainPath, "utf8")),
  awsServices: readAwsServices(fs.readFileSync(awsServicePath, "utf8")),
};

fs.mkdirSync(path.dirname(enumPath), { recursive: true });
fs.writeFileSync(enumPath, `${JSON.stringify(metadataEnums, null, 2)}\n`);
console.log(`Generated ${path.relative(process.cwd(), enumPath)}`);

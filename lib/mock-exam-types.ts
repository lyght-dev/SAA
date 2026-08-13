import type { ContentDomain } from "@/lib/question-types";

export type MockExamDomainAllocation = {
  code: ContentDomainCode;
  name: ContentDomain;
  weightPercent: number;
  questionCount: number;
};

export type ContentDomainCode = "D1" | "D2" | "D3" | "D4";

export type MockExamItem = {
  itemNumber: number;
  questionId: string;
  questionNumber: number;
  contentDomainCode: ContentDomainCode;
};

export type MockExamSet = {
  schemaVersion: 1;
  setNumber: number;
  questionCount: number;
  randomSeed: string;
  randomAlgorithm: "lcg64-fisher-yates-v1";
  sourceQuestionRange: {
    from: number;
    to: number;
  };
  contentDomains: MockExamDomainAllocation[];
  sampling: {
    withoutReplacement: true;
    allocationMethod: "largest-remainder";
  };
  items: MockExamItem[];
};

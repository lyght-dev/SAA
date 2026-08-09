export const CONTENT_DOMAINS = [
  "보안 아키텍처 설계",
  "복원력을 갖춘 아키텍처 설계",
  "고성능 아키텍처 설계",
  "비용에 최적화된 아키텍처 설계",
] as const;

export type ContentDomain = (typeof CONTENT_DOMAINS)[number];

export type Question = {
  id: string;
  questionNumber: number;
  question: string;
  choices: Array<{ key: string; text: string }>;
  answer: string;
  contentDomain: ContentDomain;
  contentTask: string;
  awsServices: string[];
};

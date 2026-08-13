import { AnonymousAuthGate } from "@/components/AnonymousAuthGate";
import { getMockExamSets } from "@/lib/mock-exams";
import { getQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [questions, mockExamSets] = await Promise.all([getQuestions(), getMockExamSets()]);
  return <AnonymousAuthGate questions={questions} mockExamSets={mockExamSets} />;
}

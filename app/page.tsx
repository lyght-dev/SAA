import { AnonymousAuthGate } from "@/components/AnonymousAuthGate";
import { getQuestions } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const questions = await getQuestions();
  return <AnonymousAuthGate questions={questions} />;
}

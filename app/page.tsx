import { SaaApp } from "@/components/SaaApp";
import { getQuestions } from "@/lib/questions";

export default async function Home() {
  const questions = await getQuestions();
  return <SaaApp questions={questions} />;
}

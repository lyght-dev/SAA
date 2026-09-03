import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { STUDY_CODE_COOKIE } from "@/lib/study-code";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

type ProgressInput = {
  questionId?: unknown;
  selectedAnswers?: unknown;
};

function getCodeHash(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore.get(STUDY_CODE_COOKIE)?.value ?? null;
}

function parseProgressInput(input: ProgressInput) {
  if (
    typeof input.questionId !== "string" ||
    !/^Q[0-9]{4}$/.test(input.questionId) ||
    !Array.isArray(input.selectedAnswers) ||
    input.selectedAnswers.length === 0 ||
    !input.selectedAnswers.every((answer) => typeof answer === "string")
  ) {
    return null;
  }

  return { question_id: input.questionId, selected_answers: input.selectedAnswers };
}

export async function GET() {
  const codeHash = getCodeHash(await cookies());
  if (!codeHash) return NextResponse.json({ message: "학습 코드가 필요합니다." }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from("question_progress")
    .select("question_id, selected_answers, is_correct")
    .eq("access_code_hash", codeHash);

  if (error) {
    console.error("Study code progress load failed", error);
    return NextResponse.json({ message: "학습 기록을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ progress: data ?? [] });
}

export async function PUT(request: Request) {
  const codeHash = getCodeHash(await cookies());
  if (!codeHash) return NextResponse.json({ message: "학습 코드가 필요합니다." }, { status: 401 });

  let progress: ReturnType<typeof parseProgressInput>;
  try {
    progress = parseProgressInput(await request.json() as ProgressInput);
  } catch {
    progress = null;
  }

  if (!progress) return NextResponse.json({ message: "답안 형식이 올바르지 않습니다." }, { status: 400 });

  const { error } = await createAdminClient()
    .from("question_progress")
    .upsert({ ...progress, access_code_hash: codeHash }, { onConflict: "access_code_hash,question_id" });

  if (error) {
    console.error("Study code progress save failed", error);
    return NextResponse.json({ message: "학습 기록을 저장하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST() {
  const codeHash = getCodeHash(await cookies());
  if (!codeHash) return NextResponse.json({ message: "학습 코드가 필요합니다." }, { status: 401 });

  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ merged: false });

  const admin = createAdminClient();
  const { data: existingImport, error: importLookupError } = await admin
    .from("study_code_progress_imports")
    .select("source_user_id")
    .eq("access_code_hash", codeHash)
    .eq("source_user_id", user.id)
    .maybeSingle();

  if (importLookupError) {
    console.error("Study code import lookup failed", importLookupError);
    return NextResponse.json({ message: "기존 기록을 확인하지 못했습니다." }, { status: 500 });
  }
  if (existingImport) return NextResponse.json({ merged: false });

  const { data: browserProgress, error: browserProgressError } = await userClient
    .from("question_progress")
    .select("question_id, selected_answers")
    .eq("user_id", user.id);

  if (browserProgressError) {
    console.error("Browser progress import load failed", browserProgressError);
    return NextResponse.json({ message: "기존 기록을 불러오지 못했습니다." }, { status: 500 });
  }

  if (browserProgress?.length) {
    const { error: upsertError } = await admin
      .from("question_progress")
      .upsert(
        browserProgress.map((progress) => ({ ...progress, access_code_hash: codeHash })),
        { onConflict: "access_code_hash,question_id" },
      );

    if (upsertError) {
      console.error("Browser progress import save failed", upsertError);
      return NextResponse.json({ message: "기존 기록을 가져오지 못했습니다." }, { status: 500 });
    }
  }

  const { error: importSaveError } = await admin
    .from("study_code_progress_imports")
    .insert({ access_code_hash: codeHash, source_user_id: user.id });

  if (importSaveError) {
    console.error("Study code import record failed", importSaveError);
    return NextResponse.json({ message: "기존 기록을 가져오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ merged: Boolean(browserProgress?.length) });
}

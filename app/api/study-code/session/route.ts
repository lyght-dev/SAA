import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getStudyCodeHash, normalizeStudyCode, STUDY_CODE_COOKIE, STUDY_CODE_PATTERN } from "@/lib/study-code";

export async function POST(request: Request) {
  let code: string;

  try {
    const body = await request.json() as { code?: unknown };
    code = typeof body.code === "string" ? normalizeStudyCode(body.code) : "";
  } catch {
    return NextResponse.json({ message: "코드를 확인해 주세요." }, { status: 400 });
  }

  if (!STUDY_CODE_PATTERN.test(code)) {
    return NextResponse.json({ message: "코드는 영문·숫자 6자리여야 합니다." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(STUDY_CODE_COOKIE, getStudyCodeHash(code), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

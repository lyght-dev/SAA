"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SaaApp } from "@/components/SaaApp";
import type { MockExamSet } from "@/lib/mock-exam-types";
import type { Question } from "@/lib/question-types";
import { createClient } from "@/utils/supabase/client";

type AuthState =
  | { status: "checking" }
  | { status: "selecting"; userId: string | null; message?: string }
  | { status: "challenge"; message?: string }
  | { status: "signing-in" }
  | { status: "code-signing-in"; userId: string | null }
  | { status: "ready"; userId: string | null; progressMode: "browser" | "code" };

export function AnonymousAuthGate({
  questions,
  mockExamSets,
}: {
  questions: Question[];
  mockExamSets: MockExamSet[];
}) {
  const [supabase] = useState(createClient);
  const [authState, setAuthState] = useState<AuthState>({ status: "checking" });
  const [studyCode, setStudyCode] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      setAuthState({ status: "selecting", userId: !error ? data.session?.user.id ?? null : null });
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function signInAnonymously(captchaToken: string) {
    setAuthState({ status: "signing-in" });

    const { data, error } = await supabase.auth.signInAnonymously({
      options: { captchaToken },
    });

    if (error || !data.user) {
      turnstileRef.current?.reset();
      setAuthState({
        status: "challenge",
        message: error?.message ?? "기기 인증에 실패했습니다. 다시 시도해 주세요.",
      });
      return;
    }

    setAuthState({ status: "ready", userId: data.user.id, progressMode: "browser" });
  }

  async function signInWithStudyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = studyCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      const userId = authState.status === "selecting" ? authState.userId : null;
      setAuthState({ status: "selecting", userId, message: "코드는 영문·숫자 6자리로 입력해 주세요." });
      return;
    }

    const userId = authState.status === "selecting" ? authState.userId : null;
    setAuthState({ status: "code-signing-in", userId });
    const response = await fetch("/api/study-code/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalizedCode }),
    });

    if (!response.ok) {
      const { message } = await response.json().catch(() => ({ message: "코드를 연결하지 못했습니다." })) as { message?: string };
      setAuthState({ status: "selecting", userId, message: message ?? "코드를 연결하지 못했습니다." });
      return;
    }

    setAuthState({ status: "ready", userId, progressMode: "code" });
  }

  function continueWithoutCode() {
    if (authState.status !== "selecting") return;
    if (authState.userId) {
      setAuthState({ status: "ready", userId: authState.userId, progressMode: "browser" });
      return;
    }
    setAuthState({ status: "challenge" });
  }

  if (authState.status === "ready") {
    return (
      <SaaApp
        questions={questions}
        mockExamSets={mockExamSets}
        userId={authState.userId}
        progressMode={authState.progressMode}
      />
    );
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <main className="mobile-shell auth-gate">
      <div className="auth-gate-orb" aria-hidden="true" />
      <section className="auth-gate-card" aria-live="polite">
        <ShieldCheck size={30} strokeWidth={1.4} aria-hidden="true" />
        <p className="eyebrow">Study progress</p>
        <h1>학습 코드를<br />입력해 주세요.</h1>
        <p>코드가 있으면 어느 브라우저에서나 같은 학습 기록을 이어갈 수 있어요.</p>

        {authState.status === "selecting" || authState.status === "code-signing-in" ? (
          <form className="auth-code-form" onSubmit={signInWithStudyCode}>
            <label htmlFor="study-code">학습 코드</label>
            <input
              id="study-code"
              value={studyCode}
              onChange={(event) => setStudyCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={6}
              placeholder="예: SAA123"
              aria-describedby="study-code-help"
              disabled={authState.status === "code-signing-in"}
            />
            <p id="study-code-help">영문·숫자 6자리</p>
            <button className="button button-primary" type="submit" disabled={studyCode.length !== 6 || authState.status === "code-signing-in"}>
              {authState.status === "code-signing-in" ? "코드 연결 중" : "코드로 계속"}
            </button>
            <button className="button button-secondary" type="button" onClick={continueWithoutCode} disabled={authState.status === "code-signing-in"}>
              코드 없이 계속
            </button>
          </form>
        ) : null}

        {authState.status === "selecting" && authState.message ? (
          <p className="auth-gate-error">{authState.message}</p>
        ) : null}

        {authState.status === "challenge" && siteKey ? (
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={(token) => void signInAnonymously(token)}
            onError={() =>
              setAuthState({ status: "challenge", message: "보안 확인을 불러오지 못했습니다." })
            }
            options={{ appearance: "interaction-only", theme: "light" }}
          />
        ) : null}

        {authState.status === "challenge" && !siteKey ? (
          <p className="auth-gate-error">Turnstile Site key가 설정되지 않았습니다.</p>
        ) : null}

        {authState.status === "challenge" && authState.message ? (
          <>
            <p className="auth-gate-error">{authState.message}</p>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setAuthState({ status: "ready", userId: null, progressMode: "browser" })}
            >
              로컬 모드로 계속
            </button>
          </>
        ) : null}

        {authState.status !== "challenge" ? (
          <div className="auth-gate-loader" aria-label="인증 중">
            <span />
          </div>
        ) : null}
      </section>
    </main>
  );
}

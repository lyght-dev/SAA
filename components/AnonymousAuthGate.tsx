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
  | { status: "challenge"; message?: string }
  | { status: "signing-in" }
  | { status: "ready"; userId: string | null };

export function AnonymousAuthGate({
  questions,
  mockExamSets,
}: {
  questions: Question[];
  mockExamSets: MockExamSet[];
}) {
  const [supabase] = useState(createClient);
  const [authState, setAuthState] = useState<AuthState>({ status: "checking" });
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session?.user && !error) {
        setAuthState({ status: "ready", userId: data.session.user.id });
        return;
      }

      setAuthState({ status: "challenge" });
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

    setAuthState({ status: "ready", userId: data.user.id });
  }

  if (authState.status === "ready") {
    return <SaaApp questions={questions} mockExamSets={mockExamSets} userId={authState.userId} />;
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <main className="mobile-shell auth-gate">
      <div className="auth-gate-orb" aria-hidden="true" />
      <section className="auth-gate-card" aria-live="polite">
        <ShieldCheck size={30} strokeWidth={1.4} aria-hidden="true" />
        <p className="eyebrow">Secure progress</p>
        <h1>학습 기록을 준비하고 있어요.</h1>
        <p>이 브라우저만의 안전한 학습 공간을 연결합니다.</p>

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
              onClick={() => setAuthState({ status: "ready", userId: null })}
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

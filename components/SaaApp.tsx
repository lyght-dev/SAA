"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  CircleAlert,
  ClipboardList,
  House,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { MockExamSet } from "@/lib/mock-exam-types";
import { CONTENT_DOMAINS, type ContentDomain, type Question } from "@/lib/question-types";
import { createClient } from "@/utils/supabase/client";

type QuestionStatus = "unanswered" | "correct" | "incorrect";
type StatusMap = Record<string, QuestionStatus>;
type AnswerMap = Record<string, string[]>;

const FALLBACK_STATUS_KEY = "saa-db-fallback-status-v1";
const FALLBACK_ANSWER_KEY = "saa-db-fallback-answers-v1";
const LEGACY_STATUS_KEY = "saa-question-status";
const LEGACY_ANSWER_KEY = "saa-question-answers";

type Screen =
  | { name: "intro" }
  | { name: "home" }
  | { name: "domains" }
  | { name: "mock-exams" }
  | { name: "mock-list"; setNumber: number }
  | { name: "list"; domain: ContentDomain }
  | { name: "wrong-list" }
  | { name: "question"; questionId: string }
  | { name: "explanation"; questionId: string; selectedAnswers: string[] };

type QueueOrigin =
  | { type: "domain"; domain: ContentDomain }
  | { type: "wrong" }
  | { type: "mock-exam"; setNumber: number };

const domainMeta = [
  { eyebrow: "Content domain 1", short: "Security", accent: "mint" },
  { eyebrow: "Content domain 2", short: "Resilience", accent: "peach" },
  { eyebrow: "Content domain 3", short: "Performance", accent: "lavender" },
  { eyebrow: "Content domain 4", short: "Cost", accent: "sky" },
] as const;

const statusLabels: Record<QuestionStatus, string> = {
  unanswered: "안 푼 문제",
  correct: "맞춘 문제",
  incorrect: "틀린 문제",
};

function Header({ title, onBack, onHome }: { title: string; onBack?: () => void; onHome?: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-side">
        {onBack ? (
          <button className="icon-button" type="button" onClick={onBack} aria-label="이전 화면">
            <ArrowLeft aria-hidden="true" size={21} strokeWidth={1.8} />
          </button>
        ) : (
          <span className="wordmark-small">SAA.</span>
        )}
      </div>
      <p className="topbar-title">{title}</p>
      <div className="topbar-side topbar-side-end">
        {onHome ? (
          <button className="icon-button" type="button" onClick={onHome} aria-label="홈으로 이동">
            <House aria-hidden="true" size={19} strokeWidth={1.7} />
          </button>
        ) : null}
      </div>
    </header>
  );
}

function StatusMark({ status }: { status: QuestionStatus }) {
  if (status === "correct") {
    return <Check aria-hidden="true" size={14} strokeWidth={2.4} />;
  }
  if (status === "incorrect") {
    return <X aria-hidden="true" size={14} strokeWidth={2.4} />;
  }
  return <Circle aria-hidden="true" size={9} fill="currentColor" strokeWidth={0} />;
}

function EmptyWrongList({ onGoBack }: { onGoBack: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-orb" aria-hidden="true" />
      <ShieldCheck size={30} strokeWidth={1.4} aria-hidden="true" />
      <h2>아직 틀린 문제가 없어요.</h2>
      <p>새로운 문제를 풀고 학습 기록을 만들어 보세요.</p>
      <button className="button button-primary" type="button" onClick={onGoBack}>
        문제 풀러가기
      </button>
    </div>
  );
}

type ProgressRow = {
  question_id: string;
  selected_answers: string[];
  is_correct: boolean;
};

export function SaaApp({
  questions,
  mockExamSets,
  userId,
}: {
  questions: Question[];
  mockExamSets: MockExamSet[];
  userId: string | null;
}) {
  const [supabase] = useState(createClient);
  const [screen, setScreen] = useState<Screen>({ name: "intro" });
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [savedAnswers, setSavedAnswers] = useState<AnswerMap>({});
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [queueOrigin, setQueueOrigin] = useState<QueueOrigin | null>(null);

  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );
  const mockExamByNumber = useMemo(
    () => new Map(mockExamSets.map((set) => [set.setNumber, set])),
    [mockExamSets],
  );

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      if (!userId) {
        try {
          const fallbackStatuses = window.localStorage.getItem(FALLBACK_STATUS_KEY);
          const fallbackAnswers = window.localStorage.getItem(FALLBACK_ANSWER_KEY);
          setStatuses(fallbackStatuses ? JSON.parse(fallbackStatuses) as StatusMap : {});
          setSavedAnswers(fallbackAnswers ? JSON.parse(fallbackAnswers) as AnswerMap : {});
        } catch {
          setStatuses({});
          setSavedAnswers({});
        }
        return;
      }

      const { data, error } = await supabase
        .from("question_progress")
        .select("question_id, selected_answers, is_correct")
        .eq("user_id", userId);

      if (!active) return;

      if (error) {
        console.error("Supabase progress load failed", error);
        try {
          const fallbackStatuses = window.localStorage.getItem(FALLBACK_STATUS_KEY);
          const fallbackAnswers = window.localStorage.getItem(FALLBACK_ANSWER_KEY);
          setStatuses(fallbackStatuses ? JSON.parse(fallbackStatuses) as StatusMap : {});
          setSavedAnswers(fallbackAnswers ? JSON.parse(fallbackAnswers) as AnswerMap : {});
        } catch {
          setStatuses({});
          setSavedAnswers({});
        }
        return;
      }

      const remoteStatuses: StatusMap = {};
      const remoteAnswers: AnswerMap = {};
      for (const row of (data ?? []) as ProgressRow[]) {
        remoteStatuses[row.question_id] = row.is_correct ? "correct" : "incorrect";
        remoteAnswers[row.question_id] = row.selected_answers;
      }

      try {
        window.localStorage.removeItem(LEGACY_STATUS_KEY);
        window.localStorage.removeItem(LEGACY_ANSWER_KEY);
        window.localStorage.removeItem(FALLBACK_STATUS_KEY);
        window.localStorage.removeItem(FALLBACK_ANSWER_KEY);
      } catch {
        // The database remains the source of truth when browser storage is unavailable.
      }

      if (!active) return;
      setStatuses(remoteStatuses);
      setSavedAnswers(remoteAnswers);
    }

    void loadProgress();
    return () => {
      active = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (screen.name !== "intro") return;
    const timer = window.setTimeout(() => setScreen({ name: "home" }), 1650);
    return () => window.clearTimeout(timer);
  }, [screen.name]);

  const getStatus = (id: string): QuestionStatus => statuses[id] ?? "unanswered";
  const correctCount = questions.filter((question) => getStatus(question.id) === "correct").length;
  const wrongCount = questions.filter((question) => getStatus(question.id) === "incorrect").length;
  const solvedCount = correctCount + wrongCount;

  const openQuestion = (question: Question, queue: Question[], origin: QueueOrigin) => {
    setQuestionQueue(queue.map((item) => item.id));
    setQueueOrigin(origin);
    setSelectedAnswers(savedAnswers[question.id] ?? []);
    setScreen({ name: "question", questionId: question.id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAnswer = (question: Question) => {
    if (selectedAnswers.length !== question.answer.length) return;
    const normalizedSelection = [...selectedAnswers].sort();
    const normalizedAnswer = [...question.answer].sort();
    const isCorrect = normalizedSelection.every((answer, index) => answer === normalizedAnswer[index]);
    const result: QuestionStatus = isCorrect ? "correct" : "incorrect";
    setStatuses((current) => ({ ...current, [question.id]: result }));
    setSavedAnswers((current) => ({ ...current, [question.id]: [...selectedAnswers] }));

    const saveLocalFallback = () => {
      try {
        window.localStorage.setItem(
          FALLBACK_STATUS_KEY,
          JSON.stringify({ ...statuses, [question.id]: result }),
        );
        window.localStorage.setItem(
          FALLBACK_ANSWER_KEY,
          JSON.stringify({ ...savedAnswers, [question.id]: [...selectedAnswers] }),
        );
      } catch {
        // The current in-memory session remains usable.
      }
    };

    if (!userId) {
      saveLocalFallback();
      setScreen({ name: "explanation", questionId: question.id, selectedAnswers });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    void supabase
      .from("question_progress")
      .upsert(
        {
          user_id: userId,
          question_id: question.id,
          selected_answers: selectedAnswers,
        },
        { onConflict: "user_id,question_id" },
      )
      .then(({ error }) => {
        if (!error) {
          try {
            window.localStorage.removeItem(FALLBACK_STATUS_KEY);
            window.localStorage.removeItem(FALLBACK_ANSWER_KEY);
          } catch {
            // The database write succeeded, so no local fallback is required.
          }
          return;
        }

        console.error("Supabase progress save failed", error);
        saveLocalFallback();
      });
    setScreen({ name: "explanation", questionId: question.id, selectedAnswers });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const returnToQuestionList = (question: Question) => {
    if (queueOrigin?.type === "wrong") {
      setScreen({ name: "wrong-list" });
      return;
    }
    if (queueOrigin?.type === "mock-exam") {
      setScreen({ name: "mock-list", setNumber: queueOrigin.setNumber });
      return;
    }
    setScreen({ name: "list", domain: queueOrigin?.domain ?? question.contentDomain });
  };

  if (screen.name === "intro") {
    return (
      <main className="mobile-shell intro-screen" onClick={() => setScreen({ name: "home" })}>
        <button className="intro-skip" type="button" onClick={() => setScreen({ name: "home" })}>
          건너뛰기
        </button>
        <div className="intro-orb intro-orb-one" aria-hidden="true" />
        <div className="intro-orb intro-orb-two" aria-hidden="true" />
        <div className="intro-content">
          <p className="eyebrow">Architecture study</p>
          <h1>SAA.</h1>
          <p>생각의 구조를 익히는<br />AWS 아키텍처 스터디</p>
        </div>
        <div className="intro-loader" aria-label="앱을 여는 중">
          <span />
        </div>
      </main>
    );
  }

  if (screen.name === "home") {
    return (
      <main className="mobile-shell">
        <Header title="Architecture study" />
        <div className="screen-content home-content">
          <section className="home-hero">
            <div className="hero-orb" aria-hidden="true" />
            <p className="eyebrow">Solutions Architect Associate</p>
            <h1>오늘도,<br />한 문제씩.</h1>
            <p className="hero-copy">정답보다 중요한 건 아키텍처를 바라보는 순서입니다.</p>
          </section>

          <section className="progress-card" aria-label="학습 현황">
            <div>
              <p className="section-label">Your progress</p>
              <p className="progress-number">{solvedCount}<span> / {questions.length}</span></p>
            </div>
            <div className="progress-ring" style={{ "--progress": `${questions.length ? (solvedCount / questions.length) * 360 : 0}deg` } as React.CSSProperties}>
              <span>{questions.length ? Math.round((solvedCount / questions.length) * 100) : 0}%</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${questions.length ? (solvedCount / questions.length) * 100 : 0}%` }} />
            </div>
            <div className="progress-meta">
              <span><i className="status-dot status-dot-correct" />맞춘 문제 {correctCount}</span>
              <span><i className="status-dot status-dot-wrong" />틀린 문제 {wrongCount}</span>
            </div>
          </section>

          <section className="home-actions" aria-label="학습 메뉴">
            <button className="action-card action-card-primary" type="button" onClick={() => setScreen({ name: "domains" })}>
              <span className="action-icon"><BookOpen size={23} strokeWidth={1.55} /></span>
              <span className="action-copy">
                <strong>문제 풀러가기</strong>
                <small>4개 도메인에서 시작하기</small>
              </span>
              <ArrowRight size={20} strokeWidth={1.7} />
            </button>
            <button className="action-card action-card-exam" type="button" onClick={() => setScreen({ name: "mock-exams" })} disabled={!mockExamSets.length}>
              <span className="action-icon action-icon-exam"><ClipboardList size={22} strokeWidth={1.5} /></span>
              <span className="action-copy">
                <strong>모의고사 풀기</strong>
                <small>{mockExamSets.length ? `${mockExamSets.length}개의 실전 세트` : "준비된 모의고사가 없어요"}</small>
              </span>
              <ChevronRight size={20} strokeWidth={1.7} />
            </button>
            <button className="action-card" type="button" onClick={() => setScreen({ name: "wrong-list" })}>
              <span className="action-icon action-icon-light"><RotateCcw size={22} strokeWidth={1.55} /></span>
              <span className="action-copy">
                <strong>틀린 문제 다시 풀기</strong>
                <small>{wrongCount ? `${wrongCount}개의 문제가 기다리고 있어요` : "복습할 문제가 아직 없어요"}</small>
              </span>
              <ChevronRight size={20} strokeWidth={1.7} />
            </button>
          </section>

          <p className="home-footnote">Small steps. Strong architecture.</p>
        </div>
      </main>
    );
  }

  if (screen.name === "mock-exams") {
    return (
      <main className="mobile-shell">
        <Header title="모의고사" onBack={() => setScreen({ name: "home" })} onHome={() => setScreen({ name: "home" })} />
        <div className="screen-content">
          <section className="page-heading mock-exam-heading">
            <p className="eyebrow">Mock examination</p>
            <h1>실전처럼,<br />한 세트씩.</h1>
            <p>출제 비중에 맞춰 구성된 모의고사를 선택하세요.</p>
          </section>

          <div className="mock-set-list">
            {mockExamSets.map((set) => {
              const availableIds = set.items.filter((item) => questionById.has(item.questionId));
              const solved = availableIds.filter((item) => getStatus(item.questionId) !== "unanswered").length;
              const progress = availableIds.length ? (solved / availableIds.length) * 100 : 0;
              const complete = availableIds.length === set.questionCount;

              return (
                <button
                  className="mock-set-card"
                  type="button"
                  key={set.setNumber}
                  onClick={() => setScreen({ name: "mock-list", setNumber: set.setNumber })}
                  disabled={!complete}
                >
                  <span className="mock-set-index">SET {String(set.setNumber).padStart(2, "0")}</span>
                  <span className="mock-set-copy">
                    <strong>모의고사 {set.setNumber}회</strong>
                    <small>{set.questionCount}문항 · 4개 콘텐츠 도메인</small>
                  </span>
                  <span className="mock-set-progress" aria-label={`${solved}문항 풀이 완료`}>
                    <span><i style={{ width: `${progress}%` }} /></span>
                    <small>{complete ? `${solved} / ${set.questionCount}` : "문항 준비 중"}</small>
                  </span>
                  <span className="mock-set-arrow"><ArrowRight size={19} strokeWidth={1.6} /></span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  if (screen.name === "mock-list") {
    const mockExam = mockExamByNumber.get(screen.setNumber);
    const examItems = mockExam?.items.flatMap((item) => {
      const question = questionById.get(item.questionId);
      return question ? [{ item, question }] : [];
    }).sort((a, b) => a.item.itemNumber - b.item.itemNumber) ?? [];
    const examQuestions = examItems.map(({ question }) => question);
    const solved = examQuestions.filter((question) => getStatus(question.id) !== "unanswered").length;
    const correct = examQuestions.filter((question) => getStatus(question.id) === "correct").length;

    if (!mockExam) {
      return (
        <main className="mobile-shell">
          <Header title="모의고사를 찾을 수 없음" onBack={() => setScreen({ name: "mock-exams" })} onHome={() => setScreen({ name: "home" })} />
          <div className="screen-content"><div className="empty-state"><CircleAlert /><h2>세트를 불러오지 못했어요.</h2></div></div>
        </main>
      );
    }

    return (
      <main className="mobile-shell">
        <Header title={`모의고사 ${mockExam.setNumber}회`} onBack={() => setScreen({ name: "mock-exams" })} onHome={() => setScreen({ name: "home" })} />
        <div className="screen-content mock-list-content">
          <section className="mock-sheet-summary">
            <div className="mock-sheet-orb" aria-hidden="true" />
            <p className="eyebrow">Set {String(mockExam.setNumber).padStart(2, "0")}</p>
            <h1>{mockExam.questionCount}<span> questions</span></h1>
            <div className="mock-sheet-stats">
              <span>풀이 {solved}</span>
              <span>정답 {correct}</span>
              <span>남은 문제 {mockExam.questionCount - solved}</span>
            </div>
            <div className="mock-domain-distribution" aria-label="콘텐츠 도메인 출제 비중">
              {mockExam.contentDomains.map((domain) => (
                <span key={domain.code} style={{ flexGrow: domain.questionCount }} title={`${domain.name} ${domain.questionCount}문항`} />
              ))}
            </div>
          </section>

          <section className="mock-answer-card">
            <div className="mock-answer-heading">
              <div><p className="section-label">Answer sheet</p><h2>문제 목록</h2></div>
              <small>{solved} / {mockExam.questionCount}</small>
            </div>
            <div className="mock-status-legend" aria-label="문제 상태 범례">
              <span><i className="status-dot" />미풀이</span>
              <span><i className="status-dot status-dot-correct" />정답</span>
              <span><i className="status-dot status-dot-wrong" />오답</span>
            </div>
            <div className="mock-question-grid">
              {examItems.map(({ item, question }) => {
                const status = getStatus(question.id);
                return (
                  <button
                    type="button"
                    className={`mock-question-number mock-question-number-${status}`}
                    key={question.id}
                    onClick={() => openQuestion(question, examQuestions, { type: "mock-exam", setNumber: mockExam.setNumber })}
                    aria-label={`${item.itemNumber}번, ${statusLabels[status]}`}
                  >
                    <span>{item.itemNumber}</span>
                    <i><StatusMark status={status} /></i>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (screen.name === "domains") {
    return (
      <main className="mobile-shell">
        <Header title="콘텐츠 도메인" onBack={() => setScreen({ name: "home" })} onHome={() => setScreen({ name: "home" })} />
        <div className="screen-content">
          <section className="page-heading">
            <p className="eyebrow">Choose a domain</p>
            <h1>어떤 아키텍처를<br />공부할까요?</h1>
            <p>집중할 영역을 하나 선택해 주세요.</p>
          </section>
          <div className="domain-list">
            {CONTENT_DOMAINS.map((domain, index) => {
              const count = questions.filter((question) => question.contentDomain === domain).length;
              const solved = questions.filter(
                (question) => question.contentDomain === domain && getStatus(question.id) !== "unanswered",
              ).length;
              const meta = domainMeta[index];
              return (
                <button
                  className="domain-card"
                  type="button"
                  key={domain}
                  onClick={() => setScreen({ name: "list", domain })}
                  disabled={!count}
                >
                  <span className={`domain-orb domain-orb-${meta.accent}`} aria-hidden="true" />
                  <span className="domain-index">0{index + 1}</span>
                  <span className="domain-content">
                    <small>{meta.eyebrow}</small>
                    <strong>{domain}</strong>
                    <span>{meta.short} · {solved}/{count} 완료</span>
                  </span>
                  <span className="domain-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  if (screen.name === "list" || screen.name === "wrong-list") {
    const isWrongList = screen.name === "wrong-list";
    const list = isWrongList
      ? questions.filter((question) => getStatus(question.id) === "incorrect")
      : questions.filter((question) => question.contentDomain === screen.domain);
    const title = isWrongList ? "틀린 문제" : screen.domain;

    return (
      <main className="mobile-shell">
        <Header title={title} onBack={() => setScreen(isWrongList ? { name: "home" } : { name: "domains" })} onHome={() => setScreen({ name: "home" })} />
        <div className="screen-content list-content">
          <section className="page-heading list-heading">
            <p className="eyebrow">{isWrongList ? "Review notes" : "Question index"}</p>
            <h1>{isWrongList ? <>다시 보면,<br />분명해져요.</> : <>문제를<br />선택하세요.</>}</h1>
            <p>{isWrongList ? `${list.length}개의 틀린 문제를 다시 확인해 보세요.` : `총 ${list.length}개의 문제가 준비되어 있어요.`}</p>
          </section>

          {isWrongList && !list.length ? (
            <EmptyWrongList onGoBack={() => setScreen({ name: "domains" })} />
          ) : (
            <>
              <div className="status-legend" aria-label="문제 상태 범례">
                <span><i className="status-dot" />안 푼 문제</span>
                <span><i className="status-dot status-dot-correct" />맞춘 문제</span>
                <span><i className="status-dot status-dot-wrong" />틀린 문제</span>
              </div>
              <div className="question-grid">
                {list.map((question, index) => {
                  const status = getStatus(question.id);
                  return (
                    <button
                      type="button"
                      className={`question-number question-number-${status}`}
                      key={question.id}
                      onClick={() => openQuestion(
                        question,
                        list,
                        isWrongList ? { type: "wrong" } : { type: "domain", domain: question.contentDomain },
                      )}
                      aria-label={`${index + 1}번, ${statusLabels[status]}`}
                    >
                      <span>{index + 1}</span>
                      <i><StatusMark status={status} /></i>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  const activeQuestion = questionById.get(screen.questionId);
  if (!activeQuestion) {
    return (
      <main className="mobile-shell">
        <Header title="문제를 찾을 수 없음" onBack={() => setScreen({ name: "home" })} onHome={() => setScreen({ name: "home" })} />
        <div className="empty-state"><CircleAlert /><h2>문제를 불러오지 못했어요.</h2></div>
      </main>
    );
  }

  const domainIndex = CONTENT_DOMAINS.indexOf(activeQuestion.contentDomain);
  const queueIndex = questionQueue.indexOf(activeQuestion.id);
  const displayNumber = queueIndex >= 0 ? queueIndex + 1 : activeQuestion.questionNumber;

  if (screen.name === "question") {
    return (
      <main className="mobile-shell question-shell">
        <Header title={`Question ${displayNumber}`} onBack={() => returnToQuestionList(activeQuestion)} onHome={() => setScreen({ name: "home" })} />
        <div className="question-content">
          <section className="classification-bar">
            <div>
              <p className="section-label">Content domain {domainIndex + 1}</p>
              <div className="classification-detail">
                <strong>{activeQuestion.contentDomain}</strong>
                <span>{activeQuestion.contentTask}</span>
              </div>
            </div>
          </section>

          <section className="question-prompt">
            <div className="question-counter">
              <span>Q{String(displayNumber).padStart(2, "0")}</span>
              <small>{queueIndex + 1} / {questionQueue.length || 1}</small>
            </div>
            <h1>{activeQuestion.question}</h1>
          </section>

          <fieldset className="choice-list">
            <legend className="sr-only">선택지</legend>
            {activeQuestion.choices.map((choice) => {
              const selected = selectedAnswers.includes(choice.key);
              const isMultipleChoice = activeQuestion.answer.length > 1;
              return (
                <label className={`choice-card ${selected ? "choice-card-selected" : ""}`} key={choice.key}>
                  <input
                    type={isMultipleChoice ? "checkbox" : "radio"}
                    name="answer"
                    value={choice.key}
                    checked={selected}
                    onChange={() => {
                      if (!isMultipleChoice) {
                        setSelectedAnswers([choice.key]);
                        return;
                      }

                      setSelectedAnswers((current) =>
                        current.includes(choice.key)
                          ? current.filter((answer) => answer !== choice.key)
                          : current.length < activeQuestion.answer.length
                            ? [...current, choice.key]
                            : current,
                      );
                    }}
                  />
                  <span className="choice-key">{choice.key}</span>
                  <span className="choice-text">{choice.text}</span>
                  <span className="choice-check">{selected ? <Check size={14} strokeWidth={2.4} /> : null}</span>
                </label>
              );
            })}
          </fieldset>
        </div>
        <div className="sticky-submit">
          <button className="button button-primary button-large" type="button" disabled={selectedAnswers.length !== activeQuestion.answer.length} onClick={() => submitAnswer(activeQuestion)}>
            Submit
            <ArrowRight size={18} strokeWidth={1.8} />
          </button>
        </div>
      </main>
    );
  }

  const isCorrect =
    screen.selectedAnswers.length === activeQuestion.answer.length &&
    [...screen.selectedAnswers].sort().every((answer, index) => answer === [...activeQuestion.answer].sort()[index]);
  const nextQuestionId = queueIndex >= 0 ? questionQueue[queueIndex + 1] : undefined;

  const moveToNext = () => {
    if (nextQuestionId) {
      setSelectedAnswers(savedAnswers[nextQuestionId] ?? []);
      setScreen({ name: "question", questionId: nextQuestionId });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      returnToQuestionList(activeQuestion);
    }
  };

  return (
    <main className="mobile-shell explanation-shell">
      <Header title="해설" onBack={() => setScreen({ name: "question", questionId: activeQuestion.id })} onHome={() => setScreen({ name: "home" })} />
      <div className="screen-content explanation-content">
        <section className={`result-card ${isCorrect ? "result-correct" : "result-incorrect"}`}>
          <div className="result-icon">{isCorrect ? <Check size={29} strokeWidth={1.8} /> : <X size={29} strokeWidth={1.8} />}</div>
          <p className="eyebrow">Your answer · {screen.selectedAnswers.join(", ")}</p>
          <h1>{isCorrect ? "Correct" : "Incorrect"}</h1>
        </section>

        <section className="analysis-section">
          <div className="analysis-heading">
            <span>01</span>
            <div><p className="section-label">Requirement</p><h2>요구사항 분석</h2></div>
          </div>
          <div className="analysis-card">
            <span className="analysis-icon-slot" aria-hidden="true" />
            <div>
              <strong>{activeQuestion.contentTask}</strong>
              <p>{activeQuestion.explanation.requirementsAnalysis}</p>
            </div>
          </div>
        </section>

        <section className="analysis-section">
          <div className="analysis-heading">
            <span>02</span>
            <div><p className="section-label">AWS services</p><h2>AWS 서비스 분석</h2></div>
          </div>
          <div className="service-card">
            <span className="analysis-icon-slot" aria-hidden="true" />
            <div>
              <p>이 문제의 핵심 서비스</p>
              <div className="service-tags">
                {activeQuestion.awsServices.map((service) => <span key={service}>{service}</span>)}
              </div>
              <p className="service-analysis-copy">{activeQuestion.explanation.awsServicesAnalysis}</p>
            </div>
          </div>
        </section>

        <section className="analysis-section">
          <div className="analysis-heading">
            <span>03</span>
            <div><p className="section-label">Options</p><h2>선택지 분석</h2></div>
          </div>
          <div className="choices-analysis-summary">
            <p>{activeQuestion.explanation.choicesAnalysis}</p>
          </div>
          <div className="option-analysis-list">
            {activeQuestion.choices.map((choice) => {
              const evaluation = activeQuestion.choiceEvaluations[choice.key];
              const correctChoice = evaluation.isCorrect;
              const selectedWrong = screen.selectedAnswers.includes(choice.key) && !correctChoice;
              return (
                <article className={`option-analysis ${correctChoice ? "option-analysis-correct" : ""} ${selectedWrong ? "option-analysis-wrong" : ""}`} key={choice.key}>
                  <span className="option-key">{choice.key}</span>
                  <div>
                    <div className="option-labels">
                      {correctChoice ? <span className="mini-label mini-label-correct">정답</span> : null}
                      {selectedWrong ? <span className="mini-label mini-label-wrong">내 선택</span> : null}
                    </div>
                    <p>{choice.text}</p>
                    <small>{evaluation.explanation}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="explanation-actions">
          <p className="section-label">What’s next?</p>
          <button className="button button-outline button-large" type="button" onClick={() => {
            setSelectedAnswers([]);
            setScreen({ name: "question", questionId: activeQuestion.id });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}>
            <RotateCcw size={17} strokeWidth={1.8} />
            다시 풀기
          </button>
          <button className="button button-primary button-large" type="button" onClick={moveToNext}>
            {nextQuestionId ? "다음 문제 풀기" : "문제 목록으로"}
            <ArrowRight size={18} strokeWidth={1.8} />
          </button>
        </section>
      </div>
    </main>
  );
}

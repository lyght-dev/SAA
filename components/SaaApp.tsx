"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  CircleAlert,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CONTENT_DOMAINS, type ContentDomain, type Question } from "@/lib/question-types";

type QuestionStatus = "unanswered" | "correct" | "incorrect";
type StatusMap = Record<string, QuestionStatus>;

type Screen =
  | { name: "intro" }
  | { name: "home" }
  | { name: "domains" }
  | { name: "list"; domain: ContentDomain }
  | { name: "wrong-list" }
  | { name: "question"; questionId: string }
  | { name: "explanation"; questionId: string; selectedAnswer: string };

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

function Header({ title, onBack }: { title: string; onBack?: () => void }) {
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
        {onBack ? <span className="wordmark-dot" aria-hidden="true" /> : null}
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

export function SaaApp({ questions }: { questions: Question[] }) {
  const [screen, setScreen] = useState<Screen>({ name: "intro" });
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showClassification, setShowClassification] = useState(true);
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [queueOrigin, setQueueOrigin] = useState<ContentDomain | "wrong" | null>(null);
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);

  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );

  useEffect(() => {
    let savedStatuses: StatusMap = {};
    try {
      const saved = window.localStorage.getItem("saa-question-status");
      if (saved) savedStatuses = JSON.parse(saved) as StatusMap;
    } catch {
      // The webview may disable local storage. The in-memory session still works.
    }
    window.queueMicrotask(() => {
      setStatuses(savedStatuses);
      setHasLoadedProgress(true);
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedProgress) return;
    try {
      window.localStorage.setItem("saa-question-status", JSON.stringify(statuses));
    } catch {
      // Keep the current session usable when persistence is unavailable.
    }
  }, [hasLoadedProgress, statuses]);

  useEffect(() => {
    if (screen.name !== "intro") return;
    const timer = window.setTimeout(() => setScreen({ name: "home" }), 1650);
    return () => window.clearTimeout(timer);
  }, [screen.name]);

  const getStatus = (id: string): QuestionStatus => statuses[id] ?? "unanswered";
  const correctCount = questions.filter((question) => getStatus(question.id) === "correct").length;
  const wrongCount = questions.filter((question) => getStatus(question.id) === "incorrect").length;
  const solvedCount = correctCount + wrongCount;

  const openQuestion = (question: Question, queue: Question[], origin: ContentDomain | "wrong") => {
    setQuestionQueue(queue.map((item) => item.id));
    setQueueOrigin(origin);
    setSelectedAnswer(null);
    setScreen({ name: "question", questionId: question.id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAnswer = (question: Question) => {
    if (!selectedAnswer) return;
    const result: QuestionStatus = selectedAnswer === question.answer ? "correct" : "incorrect";
    setStatuses((current) => ({ ...current, [question.id]: result }));
    setScreen({ name: "explanation", questionId: question.id, selectedAnswer });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const returnToQuestionList = (question: Question) => {
    if (queueOrigin === "wrong") {
      setScreen({ name: "wrong-list" });
      return;
    }
    setScreen({ name: "list", domain: question.contentDomain });
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

  if (screen.name === "domains") {
    return (
      <main className="mobile-shell">
        <Header title="콘텐츠 도메인" onBack={() => setScreen({ name: "home" })} />
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
        <Header title={title} onBack={() => setScreen(isWrongList ? { name: "home" } : { name: "domains" })} />
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
                      onClick={() => openQuestion(question, list, isWrongList ? "wrong" : question.contentDomain)}
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
        <Header title="문제를 찾을 수 없음" onBack={() => setScreen({ name: "home" })} />
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
        <Header title={`Question ${displayNumber}`} onBack={() => returnToQuestionList(activeQuestion)} />
        <div className="question-content">
          <section className="classification-bar">
            <div>
              <p className="section-label">Content domain {domainIndex + 1}</p>
              {showClassification ? (
                <div className="classification-detail">
                  <strong>{activeQuestion.contentDomain}</strong>
                  <span>{activeQuestion.contentTask}</span>
                </div>
              ) : null}
            </div>
            <button
              className={`toggle ${showClassification ? "toggle-on" : ""}`}
              type="button"
              role="switch"
              aria-checked={showClassification}
              aria-label="카테고리 및 문제 분류 표시"
              onClick={() => setShowClassification((current) => !current)}
            >
              <span />
            </button>
          </section>

          <section className="question-prompt">
            <div className="question-counter">
              <span>Q{String(displayNumber).padStart(2, "0")}</span>
              <small>{queueIndex + 1} / {questionQueue.length || 1}</small>
            </div>
            <h1>{activeQuestion.question}</h1>
          </section>

          <fieldset className="choice-list">
            <legend>정답을 선택하세요</legend>
            {activeQuestion.choices.map((choice) => {
              const selected = selectedAnswer === choice.key;
              return (
                <label className={`choice-card ${selected ? "choice-card-selected" : ""}`} key={choice.key}>
                  <input
                    type="radio"
                    name="answer"
                    value={choice.key}
                    checked={selected}
                    onChange={() => setSelectedAnswer(choice.key)}
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
          <button className="button button-primary button-large" type="button" disabled={!selectedAnswer} onClick={() => submitAnswer(activeQuestion)}>
            Submit
            <ArrowRight size={18} strokeWidth={1.8} />
          </button>
        </div>
      </main>
    );
  }

  const isCorrect = screen.selectedAnswer === activeQuestion.answer;
  const nextQuestionId = queueIndex >= 0 ? questionQueue[queueIndex + 1] : undefined;

  const moveToNext = () => {
    if (nextQuestionId) {
      setSelectedAnswer(null);
      setScreen({ name: "question", questionId: nextQuestionId });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      returnToQuestionList(activeQuestion);
    }
  };

  return (
    <main className="mobile-shell explanation-shell">
      <Header title="해설" onBack={() => setScreen({ name: "question", questionId: activeQuestion.id })} />
      <div className="screen-content explanation-content">
        <section className={`result-card ${isCorrect ? "result-correct" : "result-incorrect"}`}>
          <div className="result-icon">{isCorrect ? <Check size={24} /> : <X size={24} />}</div>
          <p className="eyebrow">Your answer · {screen.selectedAnswer}</p>
          <h1>{isCorrect ? "Correct" : "Incorrect"}</h1>
          <p>{isCorrect ? "좋아요. 핵심 요구사항을 정확히 짚었어요." : `정답은 ${activeQuestion.answer}입니다. 분석 순서대로 다시 확인해 보세요.`}</p>
        </section>

        <section className="analysis-section">
          <div className="analysis-heading">
            <span>01</span>
            <div><p className="section-label">Requirement</p><h2>요구사항 분석</h2></div>
          </div>
          <div className="analysis-card">
            <Target size={21} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <strong>{activeQuestion.contentTask}</strong>
              <p>문제에서 제시한 조건을 모두 만족하면서 운영 복잡성을 최소화하는 아키텍처를 찾아야 합니다.</p>
            </div>
          </div>
        </section>

        <section className="analysis-section">
          <div className="analysis-heading">
            <span>02</span>
            <div><p className="section-label">AWS services</p><h2>AWS 서비스 분석</h2></div>
          </div>
          <div className="service-card">
            <Sparkles size={21} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p>이 문제의 핵심 서비스</p>
              <div className="service-tags">
                {activeQuestion.awsServices.map((service) => <span key={service}>{service}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="analysis-section">
          <div className="analysis-heading">
            <span>03</span>
            <div><p className="section-label">Options</p><h2>보기 분석</h2></div>
          </div>
          <div className="option-analysis-list">
            {activeQuestion.choices.map((choice) => {
              const correctChoice = choice.key === activeQuestion.answer;
              const selectedWrong = choice.key === screen.selectedAnswer && !correctChoice;
              return (
                <article className={`option-analysis ${correctChoice ? "option-analysis-correct" : ""} ${selectedWrong ? "option-analysis-wrong" : ""}`} key={choice.key}>
                  <span className="option-key">{choice.key}</span>
                  <div>
                    <div className="option-labels">
                      {correctChoice ? <span className="mini-label mini-label-correct">정답</span> : null}
                      {selectedWrong ? <span className="mini-label mini-label-wrong">내 선택</span> : null}
                    </div>
                    <p>{choice.text}</p>
                    <small>{correctChoice ? "제시된 요구사항과 문제 분류에 가장 적합한 선택지입니다." : "정답이 요구하는 조건과 비교해 우선순위 또는 운영 효율성이 부족한 선택지입니다."}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="explanation-actions">
          <p className="section-label">What’s next?</p>
          <button className="button button-outline button-large" type="button" onClick={() => {
            setSelectedAnswer(null);
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

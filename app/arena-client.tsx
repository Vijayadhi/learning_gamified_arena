"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Activity, ArrowRight, BarChart3, BookOpen, BrainCircuit, Check, ChevronRight, CircleHelp, ClipboardCheck,
  Flame, Gauge, GraduationCap, LayoutDashboard, Medal, Menu, Radio, RefreshCw,
  Search, Sparkles, Swords, Target, Trophy, X, Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { QUESTIONS, TOPICS, getConcept, getQuestion, type ArenaQuestion, type Topic } from "@/lib/content";
import type { DashboardData } from "@/db/arena";
import { FacilitatorDashboard } from "@/app/facilitator-dashboard";
import { McqExamView } from "@/app/mcq-exam";

type View = "dashboard" | "learn" | "arena" | "review" | "exams" | "facilitator";
type AttemptResult = {
  score: number; cleared: boolean; matched: string[]; missing: string[]; summary: string;
  conceptTitle: string; modelAnswer: string; why: string;
};
type LearnerCatalog = { restricted: boolean; subjectIds: string[]; subjects: Array<{ id: string; title: string; description: string; color: string }>; contents: Array<{ id: string; subjectId: string; title: string; body: string }>; questions: Array<{ id: string; subjectId: string; contentId: string | null; prompt: string; answer: string; why: string; difficulty: "Foundation" | "Applied" | "Challenge" }> };

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
  { id: "learn", label: "Learning Deck", icon: BookOpen },
  { id: "arena", label: "Challenge Arena", icon: Swords },
  { id: "review", label: "Answer Review", icon: GraduationCap },
  { id: "exams", label: "MCQ Exams", icon: ClipboardCheck },
  { id: "facilitator", label: "Overall Dashboard", icon: BarChart3 },
];

const sourceLabel: Record<ArenaQuestion["source"], string> = {
  Core: "Core ML & GenAI", "Mock Client": "Mock Client", Gladiator: "Gladiator",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("en", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
}).format(new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z")));

export function ArenaApp({ user, initialDashboard, signOutPath, isFacilitator }: {
  user: { email: string; displayName: string }; initialDashboard: DashboardData; signOutPath: string; isFacilitator: boolean;
}) {
  const [view, setView] = useState<View>("dashboard");
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id);
  const [question, setQuestion] = useState<ArenaQuestion>(QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState([3]);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<"All" | ArenaQuestion["source"]>("All");
  const [mobileNav, setMobileNav] = useState(false);
  const [catalog, setCatalog] = useState<LearnerCatalog | null>(null);

  const refreshDashboard = useCallback(async () => {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    if (response.ok) setDashboard(await response.json());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refreshDashboard, 20000);
    return () => window.clearInterval(timer);
  }, [refreshDashboard]);

  useEffect(() => {
    type ModelContext = { registerTool?: (definition: Record<string, unknown>) => void };
    const modelContext = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;
    modelContext.registerTool({
      name: "get_arena_progress",
      description: "Read the signed-in learner's current AI Services Arena progress, streak and mastery.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => ({ content: [{ type: "text", text: JSON.stringify(dashboard) }] }),
    });
  }, [dashboard]);

  useEffect(() => { fetch("/api/catalog", { cache: "no-store" }).then(async (response) => response.ok ? setCatalog(await response.json() as LearnerCatalog) : undefined).catch(() => undefined); }, []);
  const availableTopics = useMemo<Topic[]>(() => {
    const builtIn = catalog?.restricted ? TOPICS.filter((topic) => catalog.subjectIds.includes(topic.id)) : TOPICS;
    const managed = (catalog?.subjects ?? []).map((subject) => ({ id: subject.id, title: subject.title, short: subject.description || "Instructor-managed learning", color: subject.color, icon: "BookOpen", outcome: subject.description || "Complete the learning content and practice its questions.", concepts: (catalog?.contents ?? []).filter((content) => content.subjectId === subject.id).map((content) => ({ key: `managed-${content.id}`, title: content.title, answer: content.body, why: "This learning content was added by your instructor.", keywords: [] })) }));
    return [...builtIn, ...managed];
  }, [catalog]);
  const allQuestions = useMemo<ArenaQuestion[]>(() => [...(catalog?.restricted ? QUESTIONS.filter((item) => catalog.subjectIds.includes(item.topicId)) : QUESTIONS), ...(catalog?.questions ?? []).map((item, index) => ({ id: item.id, source: "Core" as const, number: index + 1, topicId: item.subjectId, conceptKey: item.contentId ? `managed-${item.contentId}` : "", prompt: item.prompt, difficulty: item.difficulty }))], [catalog]);
  useEffect(() => { if (!availableTopics.some((topic) => topic.id === selectedTopic) && availableTopics[0]) setSelectedTopic(availableTopics[0].id); }, [availableTopics, selectedTopic]);

  const clearedIds = useMemo(() => new Set(dashboard.clearedQuestionIds), [dashboard.clearedQuestionIds]);
  const todayKey = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todayAttempts = dashboard.activity.find((item) => item.date === todayKey)?.attempts ?? 0;
  const filteredQuestions = useMemo(() => allQuestions.filter((item) => (source === "All" || item.source === source) && item.topicId === selectedTopic), [allQuestions, selectedTopic, source]);

  const selectQuestion = (next: ArenaQuestion) => {
    setQuestion(next); setAnswer(""); setResult(null); setConfidence([3]); setView("arena"); setMobileNav(false);
  };
  const nextQuestion = () => {
    const index = filteredQuestions.findIndex((item) => item.id === question.id);
    selectQuestion(filteredQuestions[(index + 1 + filteredQuestions.length) % filteredQuestions.length] ?? allQuestions[0]);
  };
  const submitAnswer = async () => {
    if (answer.trim().length < 10 || submitting) return;
    setSubmitting(true);
    try {
      const localDate = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const response = await fetch("/api/attempt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, answer, confidence: confidence[0], localDate }) });
      const payload = await response.json() as AttemptResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not score the answer.");
      setResult(payload); await refreshDashboard();
    } catch (error) {
      setResult({ score: 0, cleared: false, matched: [], missing: [], conceptTitle: "Try again", modelAnswer: "", why: "", summary: error instanceof Error ? error.message : "Something went wrong." });
    } finally { setSubmitting(false); }
  };

  const firstName = user.displayName.split(" ")[0].split("@")[0];
  const level = Math.max(1, Math.floor(dashboard.xp / 1200) + 1);
  const visibleNavItems = navItems.filter((item) => item.id !== "facilitator" || isFacilitator);
  return (
    <div className="arena-shell">
      <aside className={`arena-sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="sidebar-brand"><div className="brand-mark brand-mark-small"><span>AI</span></div><div><strong>Gladiator</strong><small>Learning Arena</small></div><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X /></button></div>
        <nav aria-label="Primary navigation">{visibleNavItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMobileNav(false); }}><Icon /><span>{item.label}</span>{item.id === "arena" && <em>152</em>}</button>; })}</nav>
        <div className="sidebar-mission"><div className="mission-top"><span>Daily mission</span><strong>{Math.min(todayAttempts, 3)}/3</strong></div><Progress value={Math.min(100, todayAttempts / 3 * 100)} /><small>Answer 3 challenges to keep momentum.</small></div>
        <div className="sidebar-account"><span>{user.email.slice(0, 1).toUpperCase()}</span><div><strong>{firstName}</strong><small>{user.email}</small></div><a href={signOutPath} target="_top">Sign out</a></div>
      </aside>
      {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <main className="arena-main">
        <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu /></button><div className="breadcrumb"><span>AI Services</span><ChevronRight /><strong>{navItems.find((item) => item.id === view)?.label}</strong></div><div className="topbar-stats"><span className="live-pill"><i /> LIVE</span><span><Flame /><strong>{dashboard.streak}</strong> day streak</span><span><Zap /><strong>{dashboard.xp.toLocaleString()}</strong> XP</span><span className="level-pill">LVL {level}</span></div></header>
        <div className="view-frame">
          {view === "dashboard" && <DashboardView dashboard={dashboard} firstName={firstName} level={level} onLearn={() => setView("learn")} onChallenge={() => setView("arena")} />}
          {view === "learn" && <LearnView dashboard={dashboard} topics={availableTopics} questions={allQuestions} selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic} search={search} setSearch={setSearch} onPractice={selectQuestion} />}
          {view === "arena" && <ArenaView topics={availableTopics} question={question} answer={answer} setAnswer={setAnswer} confidence={confidence} setConfidence={setConfidence} result={result} submitting={submitting} selectedTopic={selectedTopic} setSelectedTopic={(id) => { setSelectedTopic(id); const next = allQuestions.find((item) => item.topicId === id); if (next) selectQuestion(next); }} source={source} setSource={setSource} queue={filteredQuestions} clearedIds={clearedIds} onSelect={selectQuestion} onSubmit={submitAnswer} onNext={nextQuestion} />}
          {view === "review" && <ReviewView dashboard={dashboard} onRetry={(id) => { const retry = getQuestion(id); if (retry) selectQuestion(retry); }} />}
          {view === "exams" && <McqExamView />}
          {view === "facilitator" && isFacilitator && <FacilitatorDashboard />}
        </div>
      </main>
    </div>
  );
}

function DashboardView({ dashboard, firstName, level, onLearn, onChallenge }: { dashboard: DashboardData; firstName: string; level: number; onLearn: () => void; onChallenge: () => void }) {
  const chartData = dashboard.topicStats.map((stat) => ({ name: TOPICS.find((topic) => topic.id === stat.topicId)?.title.split(" ")[0] ?? stat.topicId, mastery: stat.average }));
  const nextTopic = [...dashboard.topicStats].sort((a, b) => a.average - b.average)[0];
  const nextInfo = TOPICS.find((topic) => topic.id === nextTopic?.topicId) ?? TOPICS[0];
  return <>
    <section className="hero-panel"><div><p className="eyebrow"><Sparkles /> Personal mission briefing</p><h1>Ready for the next round, {firstName}?</h1><p>Build interview-ready explanations—not memorized one-liners. Every answer is scored by the ideas you explain.</p><div className="hero-actions"><Button onClick={onChallenge}>Enter challenge <ArrowRight /></Button><Button variant="outline" onClick={onLearn}>Open learning deck</Button></div></div><div className="rank-orbit"><div><Trophy /><strong>Level {level}</strong><span>{dashboard.xp % 1200} / 1,200 XP</span></div></div></section>
    <section className="metric-grid"><Metric icon={Flame} value={`${dashboard.streak}`} label="Practice streak" note="consecutive active days" tone="amber" /><Metric icon={Target} value={`${dashboard.clearedQuestions}/152`} label="Challenges cleared" note={`${Math.round(dashboard.clearedQuestions / 152 * 100)}% of the full arena`} tone="mint" /><Metric icon={Gauge} value={`${dashboard.averageScore}%`} label="Mastery score" note="best-answer average" tone="blue" /><Metric icon={Activity} value={`${dashboard.totalAttempts}`} label="Answers submitted" note="saved to your profile" tone="violet" /></section>
    <section className="dashboard-grid"><article className="panel mastery-panel"><div className="panel-head"><div><p className="eyebrow">Mastery radar</p><h2>Your strength by track</h2></div><span className="live-pill"><i /> LIVE</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21334c" /><XAxis dataKey="name" tick={{ fill: "#8191a8", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#8191a8", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "rgba(255,255,255,.03)" }} contentStyle={{ background: "#101b2d", border: "1px solid #2b405e", borderRadius: 12 }} /><Bar dataKey="mastery" fill="#65d8b3" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
      <article className="panel next-panel"><p className="eyebrow">Recommended next</p><div className="topic-sigil" style={{ background: nextInfo.color }}><BrainCircuit /></div><h2>{nextInfo.title}</h2><p>{nextInfo.outcome}</p><div className="recommend-row"><span>Current mastery</span><strong>{nextTopic?.average ?? 0}%</strong></div><Progress value={nextTopic?.average ?? 0} /><Button onClick={onLearn}>Study this track <ArrowRight /></Button></article></section>
    <section className="dashboard-grid lower-grid"><article className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">Practice pulse</p><h2>Your recent activity</h2></div><Radio /></div><ActivityHeatmap activity={dashboard.activity} /></article></section>
  </>;
}

function Metric({ icon: Icon, value, label, note, tone }: { icon: typeof Flame; value: string; label: string; note: string; tone: string }) { return <article className={`metric-card ${tone}`}><div className="metric-icon"><Icon /></div><div><strong>{value}</strong><span>{label}</span><small>{note}</small></div></article>; }

function ActivityHeatmap({ activity }: { activity: DashboardData["activity"] }) {
  const map = new Map(activity.map((item) => [item.date, item.attempts]));
  const days = Array.from({ length: 42 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (41 - index)); const key = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date); return { key, attempts: map.get(key) ?? 0 }; });
  return <div className="heatmap">{days.map((day) => <span key={day.key} title={`${day.key}: ${day.attempts} attempts`} data-level={Math.min(day.attempts, 4)} />)}</div>;
}

function LearnView({ dashboard, topics, questions, selectedTopic, setSelectedTopic, search, setSearch, onPractice }: { dashboard: DashboardData; topics: Topic[]; questions: ArenaQuestion[]; selectedTopic: string; setSelectedTopic: (id: string) => void; search: string; setSearch: (value: string) => void; onPractice: (question: ArenaQuestion) => void }) {
  const topic = topics.find((item) => item.id === selectedTopic) ?? topics[0] ?? TOPICS[0]; const stat = dashboard.topicStats.find((item) => item.topicId === topic.id); const query = search.toLowerCase(); const concepts = topic.concepts.filter((concept) => !query || `${concept.title} ${concept.answer} ${concept.why}`.toLowerCase().includes(query)); const topicQuestions = questions.filter((item) => item.topicId === topic.id);
  return <><section className="section-title"><div><p className="eyebrow"><BookOpen /> Concept-first learning</p><h1>Learning Deck</h1><p>Understand the idea, see the best-fit explanation, then prove it in the arena.</p></div><label className="search-box"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this track…" /></label></section><div className="learn-layout"><aside className="topic-rail">{topics.map((item) => { const itemStat = dashboard.topicStats.find((entry) => entry.topicId === item.id); return <button key={item.id} className={item.id === topic.id ? "active" : ""} onClick={() => setSelectedTopic(item.id)}><i style={{ background: item.color }} /><div><strong>{item.title}</strong><span>{item.concepts.length} concepts • {itemStat?.average ?? 0}%</span></div><ChevronRight /></button>; })}</aside><section className="lesson-deck"><header className="track-header" style={{ "--track-color": topic.color } as CSSProperties}><div><span>TRACK {Math.max(1, topics.indexOf(topic) + 1)} / {topics.length}</span><h2>{topic.title}</h2><p>{topic.outcome}</p></div><div className="track-score"><strong>{stat?.average ?? 0}%</strong><span>mastery</span></div></header><div className="explain-strip"><CircleHelp /><div><strong>How to use this deck</strong><span>Read “what it means” first. “Why this answer fits” shows what makes an explanation complete—not just correct.</span></div></div><div className="concept-stack">{concepts.map((concept, index) => <details key={concept.key} className="concept-card" open={index === 0}><summary><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{concept.title}</strong><small>{topicQuestions.filter((item) => item.conceptKey === concept.key).length} arena question(s)</small></div><ChevronRight /></summary><div className="concept-body"><div className="answer-block"><span>WHAT IT MEANS</span><p>{concept.answer}</p></div><div className="fit-block"><Target /><div><span>WHY THIS IS THE BEST FIT</span><p>{concept.why}</p></div></div><div className="question-preview"><span>Questions linked to this concept</span>{topicQuestions.filter((item) => item.conceptKey === concept.key).map((item) => <button key={item.id} onClick={() => onPractice(item)}><em>{item.id}</em>{item.prompt}<ArrowRight /></button>)}</div></div></details>)}</div>{!concepts.length && <div className="empty-state"><BookOpen /><h2>Learning content is coming soon</h2><p>Your instructor has assigned this subject. Start its available questions in the Challenge Arena.</p></div>}</section></div></>;
}

function ArenaView({ topics, question, answer, setAnswer, confidence, setConfidence, result, submitting, selectedTopic, setSelectedTopic, source, setSource, queue, clearedIds, onSelect, onSubmit, onNext }: { topics: Topic[]; question: ArenaQuestion; answer: string; setAnswer: (value: string) => void; confidence: number[]; setConfidence: (value: number[]) => void; result: AttemptResult | null; submitting: boolean; selectedTopic: string; setSelectedTopic: (id: string) => void; source: "All" | ArenaQuestion["source"]; setSource: (source: "All" | ArenaQuestion["source"]) => void; queue: ArenaQuestion[]; clearedIds: Set<string>; onSelect: (q: ArenaQuestion) => void; onSubmit: () => void; onNext: () => void }) {
  return <><section className="section-title arena-heading"><div><p className="eyebrow"><Swords /> Explain-to-win challenge</p><h1>Challenge Arena</h1><p>Score 70 or higher by explaining the important ideas in your own words.</p></div><div className="clear-rule"><Medal /><span><strong>70%</strong> clear line</span></div></section><div className="arena-layout"><aside className="challenge-queue"><div className="filter-row"><select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select><select value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option>All</option><option>Core</option><option>Mock Client</option><option>Gladiator</option></select></div><div className="queue-list">{queue.map((item) => <button key={item.id} className={item.id === question.id ? "active" : ""} onClick={() => onSelect(item)}><span className={clearedIds.has(item.id) ? "cleared" : ""}>{clearedIds.has(item.id) ? <Check /> : item.id}</span><div><strong>{item.prompt}</strong><small>{item.difficulty}</small></div></button>)}</div></aside><section className="challenge-stage"><div className="challenge-meta"><span>{sourceLabel[question.source]}</span><span>{question.difficulty}</span><span>{question.id}</span></div><h2>{question.prompt}</h2><div className="coach-note"><BrainCircuit /><p><strong>Coach hint:</strong> Define the idea, explain how it works, then connect it to why or when it is useful. Do not chase exact wording.</p></div><label className="answer-label"><span>Your explanation</span><small>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</small></label><Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Explain it as if you were speaking to a client or interviewer…" className="arena-textarea" disabled={submitting} /><div className="confidence-row"><div><strong>How confident are you?</strong><span>{["", "Guessing", "Learning", "Fair", "Confident", "Can teach it"][confidence[0]]}</span></div><Slider min={1} max={5} step={1} value={confidence} onValueChange={setConfidence} /><strong>{confidence[0]}/5</strong></div>{!result && <Button className="submit-answer" onClick={onSubmit} disabled={answer.trim().length < 10 || submitting}>{submitting ? <><RefreshCw className="spin" /> Scoring ideas…</> : <>Submit explanation <Sparkles /></>}</Button>}{result && <ResultPanel result={result} onNext={onNext} />}</section></div></>;
}

function ResultPanel({ result, onNext }: { result: AttemptResult; onNext: () => void }) { return <section className={`result-panel ${result.cleared ? "passed" : "retry"}`}><div className="result-score"><div><strong>{result.score}</strong><span>/100</span></div><div><p>{result.cleared ? "Arena cleared!" : "Train and retry"}</p><span>{result.summary}</span></div></div><div className="idea-grid"><div><span>IDEAS YOU COVERED</span>{result.matched.length ? result.matched.map((item) => <em key={item}><Check />{item}</em>) : <p>Build a little more detail so the key ideas can be detected.</p>}</div><div><span>IDEAS TO ADD</span>{result.missing.length ? result.missing.map((item) => <em key={item} className="missing"><CircleHelp />{item}</em>) : <p>Excellent coverage—no major idea is missing.</p>}</div></div>{result.modelAnswer && <><div className="model-answer"><span>MODEL EXPLANATION • {result.conceptTitle}</span><p>{result.modelAnswer}</p></div><div className="best-fit"><Target /><div><span>WHY THIS ANSWER IS THE BEST FIT</span><p>{result.why}</p></div></div></>}<Button onClick={onNext}>Next challenge <ArrowRight /></Button></section>; }

function ReviewView({ dashboard, onRetry }: { dashboard: DashboardData; onRetry: (id: string) => void }) {
  return <><section className="section-title"><div><p className="eyebrow"><GraduationCap /> Evidence-based review</p><h1>Your Answer Journal</h1><p>Compare what you wrote with the best-fit explanation and target the missing ideas.</p></div></section><section className="review-summary"><span><strong>{dashboard.recentAttempts.length}</strong> recent answers</span><span><strong>{dashboard.averageScore}%</strong> best-score average</span><span><strong>{dashboard.clearedQuestions}</strong> cleared</span></section><div className="review-list">{!dashboard.recentAttempts.length && <div className="empty-state"><Swords /><h2>No answers yet</h2><p>Enter the Challenge Arena and submit your first paragraph.</p></div>}{dashboard.recentAttempts.map((attempt) => { const q = getQuestion(attempt.questionId); const concept = q ? getConcept(q.conceptKey) : null; return <details className="review-card" key={attempt.id}><summary><span className={attempt.score >= 70 ? "score-pass" : "score-retry"}>{attempt.score}</span><div><strong>{q?.prompt ?? attempt.questionId}</strong><small>{attempt.questionId} • Confidence {attempt.confidence}/5 • {formatDate(attempt.createdAt)}</small></div><ChevronRight /></summary><div className="review-body"><div><span>YOUR ANSWER</span><p>{attempt.answer}</p></div><div><span>MODEL EXPLANATION</span><p>{concept?.answer}</p></div><div className="best-fit"><Target /><div><span>WHY IT FITS</span><p>{concept?.why}</p></div></div><Button variant="outline" onClick={() => onRetry(attempt.questionId)}>Retry this challenge <RefreshCw /></Button></div></details>; })}</div></>;
}

"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Activity, BookPlus, CheckCircle2, ChevronRight, LockKeyhole, Power, Radio, Search, Target, Upload, UserPlus, Users } from "lucide-react";
import type { FacilitatorDashboard as FacilitatorData } from "@/db/facilitator";
import { getConcept, getQuestion, TOPICS } from "@/lib/content";
import { McqAdmin } from "@/app/mcq-admin";

type ClassroomState = {
  subjects: Array<{ id: string; title: string; description: string; color: string; isActive: boolean }>;
  learners: Array<{ email: string; displayName: string; isActive: boolean }>;
  assignments: Array<{ email: string; subjectId: string }>;
  contents: Array<{ id: string; subjectId: string; title: string; body: string }>;
  questions: Array<{ id: string; subjectId: string; prompt: string; answer: string; why: string; difficulty: string; isActive: boolean }>;
  accessWindows: Array<{ id: string; subjectId: string; email: string; accessCode: string; validFrom: string; validUntil: string; isActive: boolean }>;
  accessKeys: Array<{ id: string; subjectId: string; batchId: string; batchName: string; accessCode: string; validFrom: string; validUntil: string; isActive: boolean }>;
  admins: Array<{ email: string; displayName: string; isActive: boolean }>;
  batches: Array<{ id: string; subjectId: string; name: string; members: number }>;
  exams: Array<{ id: string; subjectId: string; title: string; durationSeconds: number; questionCount: number; batchIds: string[] }>;
};

const stamp = (value: string | null) => value ? new Intl.DateTimeFormat("en", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z"))) : "No attempts yet";

export function FacilitatorDashboard() {
  const [data, setData] = useState<FacilitatorData | null>(null);
  const [examReports, setExamReports] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [learner, setLearner] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classroom, setClassroom] = useState<ClassroomState | null>(null);
  const [adminError, setAdminError] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/facilitator", { cache: "no-store" });
    const payload = await response.json() as FacilitatorData & { error?: string };
    if (!response.ok) { setError(payload.error ?? "Could not load facilitator data."); return; }
    setData(payload); setError("");
    const examResponse = await fetch("/api/exams?report=true", { cache: "no-store" });
    if (examResponse.ok) setExamReports(((await examResponse.json()) as { reports?: Array<Record<string, unknown>> }).reports ?? []);
    const classroomResponse = await fetch("/api/admin", { cache: "no-store" });
    if (classroomResponse.ok) setClassroom(await classroomResponse.json());
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const attempts = useMemo(() => (data?.recentAttempts ?? []).filter((attempt) => {
    const text = `${attempt.displayName} ${attempt.email} ${attempt.questionId} ${getQuestion(attempt.questionId)?.prompt ?? ""}`.toLowerCase();
    return (subjectFilter === "all" || attempt.topicId === subjectFilter) && (learner === "all" || attempt.userId === learner) && (!query || text.includes(query.toLowerCase()));
  }), [data, learner, query, subjectFilter]);

  if (error) return <div className="facilitator-error"><Target /><h2>Facilitator dashboard unavailable</h2><p>{error}</p></div>;
  if (!data) return <div className="facilitator-loading"><Radio /><span>Loading live classroom data…</span></div>;

  return <>
    <section className="section-title facilitator-title">
      <div><p className="eyebrow"><Radio /> Live facilitator view</p><h1>Overall Dashboard</h1><p>Monitor learner activity, scores and written answers as they arrive.</p></div>
      <div className="facilitator-tools"><select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option>{TOPICS.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}{classroom?.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select><button className="refresh-live" onClick={refresh}><i /> Refreshing every 15 seconds</button></div>
    </section>

    <section className="facilitator-metrics">
      <article><Users /><div><strong>{data.totals.learners}</strong><span>Registered learners</span></div></article>
      <article><Activity /><div><strong>{data.totals.attempts}</strong><span>Total submissions</span></div></article>
      <article><CheckCircle2 /><div><strong>{data.totals.cleared}</strong><span>Questions cleared</span></div></article>
      <article><Target /><div><strong>{data.totals.averageScore}%</strong><span>Class average</span></div></article>
    </section>

    <section className="facilitator-grid">
      <article className="panel learner-board">
        <div className="panel-head"><div><p className="eyebrow">Leaderboard</p><h2>Learner progress</h2></div><span>{data.learners.length} accounts</span></div>
        <div className="learner-table"><div className="table-head"><span>Learner</span><span>Attempts</span><span>Cleared</span><span>Average</span><span>Last activity</span></div>
          {data.learners.map((item) => <button key={item.id} onClick={() => setLearner(item.id === learner ? "all" : item.id)} className={learner === item.id ? "selected" : ""}><span className="learner-name"><i>{item.displayName.slice(0, 1).toUpperCase()}</i><span><strong>{item.displayName}</strong><small>{item.email}</small></span></span><strong>{item.attempts}</strong><strong>{item.cleared}</strong><strong className={item.averageScore >= 70 ? "good" : "needs-work"}>{item.averageScore}%</strong><small>{stamp(item.lastAttemptAt)}</small></button>)}
        </div>
      </article>
      <article className="panel topic-board"><div className="panel-head"><div><p className="eyebrow">Class mastery</p><h2>By learning track</h2></div></div><div className="topic-live-list">{TOPICS.map((topic) => { const stat = data.topicStats.find((item) => item.topicId === topic.id); return <div key={topic.id}><i style={{ background: topic.color }} /><span><strong>{topic.title}</strong><small>{stat?.attempts ?? 0} attempts • {stat?.learners ?? 0} learners</small></span><em>{stat?.averageScore ?? 0}%</em></div>; })}</div></article>
    </section>

    <section className="panel submissions-panel">
      <div className="submissions-head"><div><p className="eyebrow">Answer stream</p><h2>{subjectFilter === "all" ? "Latest learner submissions" : `${attempts.length} live submissions for selected subject`}</h2></div><div className="submission-filters"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learner or question" /></label><select value={learner} onChange={(event) => setLearner(event.target.value)}><option value="all">All learners</option>{data.learners.map((item) => <option key={item.id} value={item.id}>{item.displayName} — {item.email}</option>)}</select></div></div>
      <div className="submission-list">{!attempts.length && <p className="no-submissions">No matching submissions.</p>}{attempts.map((attempt) => { const question = getQuestion(attempt.questionId); const concept = question ? getConcept(question.conceptKey) : null; return <details key={attempt.id}><summary><span className={attempt.score >= 70 ? "score-pass" : "score-retry"}>{attempt.score}</span><div><strong>{question?.prompt ?? attempt.questionId}</strong><small>{attempt.displayName} • {attempt.email} • Confidence {attempt.confidence}/5 • {stamp(attempt.createdAt)}</small></div><span>{attempt.source}</span><ChevronRight /></summary><div className="facilitator-answer"><div><span>LEARNER ANSWER</span><p>{attempt.answer}</p></div><div><span>CORRECT / MODEL ANSWER</span><p>{concept?.answer ?? "Model answer unavailable."}</p></div><div className="best-fit"><Target /><div><span>WHY THIS IS THE BEST FIT</span><p>{concept?.why}</p></div></div></div></details>; })}</div>
    </section>
    <section className="panel submissions-panel">
      <div className="submissions-head"><div><p className="eyebrow">MCQ completion reports</p><h2>Assessment results</h2></div><span>{examReports.length} completed</span></div>
      <div className="learner-table"><div className="table-head"><span>Learner</span><span>Exam</span><span>Score</span><span>Percentage</span><span>Duration</span></div>{examReports.map((report) => <div className="report-row" key={String(report.id)}><span><strong>{String(report.display_name || "Unknown learner")}</strong><small>{String(report.email)}</small></span><span>{String(report.title)}</span><strong>{String(report.score)} / {String(report.total_points)}</strong><strong>{String(report.percentage)}%</strong><span>{Math.floor(Number(report.duration_seconds ?? 0) / 60)}m {Number(report.duration_seconds ?? 0) % 60}s</span></div>)}{!examReports.length && <p className="no-submissions">No completed MCQ assessments yet.</p>}</div>
    </section>
    {classroom && <AdminControls data={classroom} onChanged={(next) => setClassroom(next)} error={adminError} setError={setAdminError} />}
  </>;
}

function AdminControls({ data, onChanged, error, setError }: { data: ClassroomState; onChanged: (value: ClassroomState) => void; error: string; setError: (value: string) => void }) {
  const [subjectTitle, setSubjectTitle] = useState(""); const [subjectDescription, setSubjectDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(""); const [lessonTitle, setLessonTitle] = useState(""); const [lessonBody, setLessonBody] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState(""); const [questionAnswer, setQuestionAnswer] = useState(""); const [questionWhy, setQuestionWhy] = useState("");
  const [learnerEmail, setLearnerEmail] = useState(""); const [assignments, setAssignments] = useState<string[]>([]);
  const [accessEmail, setAccessEmail] = useState(""); const [accessSubject, setAccessSubject] = useState(""); const [from, setFrom] = useState(""); const [until, setUntil] = useState("");
  const [adminEmail, setAdminEmail] = useState(""); const [adminName, setAdminName] = useState(""); const [adminPassword, setAdminPassword] = useState("");
  const [learnerSubject, setLearnerSubject] = useState("ai-services"); const [learnerBatch, setLearnerBatch] = useState(""); const [learnerSearch, setLearnerSearch] = useState(""); const [newLearnerName, setNewLearnerName] = useState(""); const [newLearnerEmail, setNewLearnerEmail] = useState(""); const [subjectStatusEmail, setSubjectStatusEmail] = useState(""); const [subjectStatusSubject, setSubjectStatusSubject] = useState("ai-services");
  const [batchAccessSubject, setBatchAccessSubject] = useState("ai-services"); const [batchAccessBatch, setBatchAccessBatch] = useState(""); const [batchFrom, setBatchFrom] = useState(""); const [batchUntil, setBatchUntil] = useState("");
  const save = async (payload: Record<string, unknown>, method = "POST") => {
    setError(""); const response = await fetch("/api/admin", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json() as ClassroomState & { error?: string };
    if (!response.ok) { setError(result.error ?? "Could not save changes."); return false; } onChanged(result); return true;
  };
  const importRows = async (event: ChangeEvent<HTMLInputElement>, action: "learners" | "bulk-content" | "bulk-questions") => {
    const file = event.target.files?.[0]; if (!file) return; const text = await file.text();
    const records = parseImport(text); if (!records.length) { setError("The file has no readable data rows."); return; }
    if (action === "learners") {
      const invalidRows = records.filter((record) => !validEmailValue(record.email));
      if (invalidRows.length) { setError(`Learner CSV must use email,name,batch columns. ${invalidRows.length} row(s) have an invalid email in the email column.`); return; }
    }
    await save(action === "learners" ? { action, records, subjectId: learnerSubject, batchName: learnerBatch } : { action, subjectId: selectedSubject, records }); event.target.value = "";
  };
  const chooseLearner = (email: string) => { setLearnerEmail(email); setAssignments(data.assignments.filter((item) => item.email === email).map((item) => item.subjectId)); };
  const allSubjects = data.subjects;
  const filteredLearners = data.learners.filter((item) => !learnerSearch || `${item.displayName} ${item.email}`.toLowerCase().includes(learnerSearch.toLowerCase()));
  const batchOptions = data.batches.filter((batch) => batch.subjectId === batchAccessSubject);
  return <section className="admin-workspace">
    <div className="section-title facilitator-title"><div><p className="eyebrow"><LockKeyhole /> Classroom administration</p><h1>Manage classroom</h1><p>Create subjects first, then add content, questions, learners and timed access.</p></div></div>
    {error && <p className="login-error">{error}</p>}
    <div className="admin-grid">
      <article className="panel admin-card"><div className="panel-head"><div><p className="eyebrow">Step 1</p><h2>Subjects</h2></div><BookPlus /></div><input value={subjectTitle} onChange={(e) => setSubjectTitle(e.target.value)} placeholder="Subject name" /><textarea value={subjectDescription} onChange={(e) => setSubjectDescription(e.target.value)} placeholder="Short subject description" /><button onClick={async () => { if (await save({ action: "subject", title: subjectTitle, description: subjectDescription })) { setSubjectTitle(""); setSubjectDescription(""); } }}>Add subject</button><div className="admin-list">{allSubjects.map((item) => <div key={item.id}><i style={{ background: item.color }} /><span>{item.title}</span><button title="Activate or deactivate subject" onClick={() => save({ action: "subject-active", id: item.id, isActive: !item.isActive }, "PATCH")}><Power className={item.isActive ? "is-on" : ""} /></button></div>)}</div></article>
      <article className="panel admin-card"><div className="panel-head"><div><p className="eyebrow">Step 2</p><h2>Learning & questions</h2></div><Upload /></div><select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}><option value="">Select subject</option>{allSubjects.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Learning title" /><textarea value={lessonBody} onChange={(e) => setLessonBody(e.target.value)} placeholder="Learning content" /><button onClick={async () => { if (await save({ action: "content", subjectId: selectedSubject, title: lessonTitle, body: lessonBody })) { setLessonTitle(""); setLessonBody(""); } }}>Add learning content</button><input value={questionPrompt} onChange={(e) => setQuestionPrompt(e.target.value)} placeholder="Question" /><textarea value={questionAnswer} onChange={(e) => setQuestionAnswer(e.target.value)} placeholder="Model answer" /><input value={questionWhy} onChange={(e) => setQuestionWhy(e.target.value)} placeholder="Why this answer fits (optional)" /><button onClick={async () => { if (await save({ action: "question", subjectId: selectedSubject, prompt: questionPrompt, answer: questionAnswer, why: questionWhy })) { setQuestionPrompt(""); setQuestionAnswer(""); setQuestionWhy(""); } }}>Add question</button><label className="file-import">Import learning CSV/JSON <input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => importRows(e, "bulk-content")} /></label><label className="file-import">Import questions CSV/JSON <input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => importRows(e, "bulk-questions")} /></label><small>Learning: <code>title,body</code>. Questions: <code>prompt,answer,why,keywords,difficulty</code>.</small></article>
      <article className="panel admin-card"><div className="panel-head"><div><p className="eyebrow">Step 3</p><h2>Learners, batches & subjects</h2></div><UserPlus /></div><select value={learnerSubject} onChange={(e) => setLearnerSubject(e.target.value)}><option value="">Select enrollment subject</option>{allSubjects.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input value={learnerBatch} onChange={(e) => setLearnerBatch(e.target.value)} placeholder="Batch name for this upload" /><label className="file-import">Bulk upload learners (CSV/JSON)<input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => importRows(e, "learners")} /></label><small>Required: <code>email</code>. Optional: <code>name</code>, <code>batch</code>. Every row is enrolled in the selected subject and batch.</small><select value={learnerEmail} onChange={(e) => chooseLearner(e.target.value)}><option value="">Select learner to assign</option>{data.learners.map((item) => <option key={item.email} value={item.email}>{item.displayName || item.email} — {item.email}</option>)}</select><div className="assignment-checks">{allSubjects.map((item) => <label key={item.id}><input type="checkbox" checked={assignments.includes(item.id)} onChange={(e) => setAssignments((current) => e.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />{item.title}</label>)}</div><button onClick={() => save({ action: "assignment", email: learnerEmail, subjectIds: assignments })}>Save subject visibility</button><div className="admin-list">{data.batches.map((batch) => <div key={batch.id}><span>{batch.name}<small>{batch.members} learners · {allSubjects.find((subject) => subject.id === batch.subjectId)?.title ?? batch.subjectId}</small></span></div>)}{data.learners.map((item) => <div key={item.email}><span>{item.displayName || item.email}<small>{item.email}</small></span><button onClick={() => save({ action: "learner-active", email: item.email, isActive: !item.isActive }, "PATCH")}><Power className={item.isActive ? "is-on" : ""} /></button></div>)}</div></article>
      <article className="panel admin-card"><div className="panel-head"><div><p className="eyebrow">Step 4</p><h2>Batch subject access</h2></div><LockKeyhole /></div><select value={batchAccessSubject} onChange={(e) => { setBatchAccessSubject(e.target.value); setBatchAccessBatch(""); }}><option value="">Subject</option>{allSubjects.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select value={batchAccessBatch} onChange={(e) => setBatchAccessBatch(e.target.value)}><option value="">Select batch</option>{batchOptions.map((batch) => <option key={batch.id} value={batch.id}>{batch.name} ({batch.members})</option>)}</select><label>Starts<input type="datetime-local" value={batchFrom} onChange={(e) => setBatchFrom(e.target.value)} /></label><label>Ends<input type="datetime-local" value={batchUntil} onChange={(e) => setBatchUntil(e.target.value)} /></label><button onClick={() => save({ action: "batch-access", subjectId: batchAccessSubject, batchId: batchAccessBatch, validFrom: batchFrom, validUntil: batchUntil })}>Generate common access key</button><small>Give this one key to learners in the selected batch. Invalidating it blocks the whole batch immediately.</small><div className="admin-list">{data.accessKeys.map((item) => <div key={item.id}><span><strong>{item.accessCode}</strong> · {item.batchName}<small>{allSubjects.find((s) => s.id === item.subjectId)?.title ?? item.subjectId} · until {new Date(item.validUntil).toLocaleString()}</small></span><button title={item.isActive ? "Invalidate access key" : "Key invalidated"} disabled={!item.isActive} onClick={() => save({ action: "access-key-active", id: item.id, isActive: false }, "PATCH")}><Power className={item.isActive ? "is-on" : ""} /></button></div>)}</div></article>
      <article className="panel admin-card"><div className="panel-head"><div><p className="eyebrow">Individual learner access</p><h2>Manual enrollment & controls</h2></div><UserPlus /></div><input value={newLearnerName} onChange={(e) => setNewLearnerName(e.target.value)} placeholder="Learner name" /><input value={newLearnerEmail} onChange={(e) => setNewLearnerEmail(e.target.value)} placeholder="Learner email" type="email" /><select value={learnerSubject} onChange={(e) => setLearnerSubject(e.target.value)}><option value="">Subject</option>{allSubjects.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input value={learnerBatch} onChange={(e) => setLearnerBatch(e.target.value)} placeholder="Optional batch name" /><button onClick={async () => { if (await save({ action: "learner", name: newLearnerName, email: newLearnerEmail, subjectId: learnerSubject, batchName: learnerBatch })) { setNewLearnerName(""); setNewLearnerEmail(""); } }}>Add and enroll learner</button><input value={learnerSearch} onChange={(e) => setLearnerSearch(e.target.value)} placeholder="Search learner by name or email" /><select value={subjectStatusEmail} onChange={(e) => setSubjectStatusEmail(e.target.value)}><option value="">Select learner</option>{filteredLearners.map((item) => <option key={item.email} value={item.email}>{item.displayName} — {item.email}</option>)}</select><select value={subjectStatusSubject} onChange={(e) => setSubjectStatusSubject(e.target.value)}><option value="">Subject</option>{allSubjects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><div className="admin-actions"><button onClick={() => save({ action: "subject-learner-active", email: subjectStatusEmail, subjectId: subjectStatusSubject, isActive: true }, "PATCH")}>Activate for subject</button><button onClick={() => save({ action: "subject-learner-active", email: subjectStatusEmail, subjectId: subjectStatusSubject, isActive: false }, "PATCH")}>Deactivate for subject</button></div><small>Subject activation is separate from the learner’s global account status.</small></article>
      <article className="panel admin-card"><div className="panel-head"><div><p className="eyebrow">Access control</p><h2>Administrators</h2></div><Users /></div><input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Admin name" /><input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Admin email" type="email" /><input value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Password (8+ characters)" type="password" /><button onClick={async () => { if (await save({ action: "admin", displayName: adminName, email: adminEmail, password: adminPassword })) { setAdminName(""); setAdminEmail(""); setAdminPassword(""); } }}>Add admin / change password</button><div className="admin-list">{data.admins.map((item) => <div key={item.email}><span>{item.displayName || item.email}<small>{item.email}</small></span><button onClick={() => save({ action: "admin-active", email: item.email, isActive: !item.isActive }, "PATCH")}><Power className={item.isActive ? "is-on" : ""} /></button></div>)}</div></article>
      <McqAdmin data={data} onChanged={(next) => onChanged({ ...data, ...next })} setError={setError} />
    </div>
  </section>;
}

function parseImport(text: string): Array<Record<string, string>> {
  try { const json = JSON.parse(text); if (Array.isArray(json)) return json.filter((row): row is Record<string, string> => Boolean(row) && typeof row === "object"); } catch { /* parse as CSV */ }
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map(parseCsvLine); const headers = rows.shift()?.map((cell) => cell.trim().toLowerCase()) ?? [];
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]))).filter((row) => Object.values(row).some(Boolean));
}
function parseCsvLine(line: string) { const cells: string[] = []; let cell = "", quoted = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"' && line[i + 1] === '"') { cell += '"'; i += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { cells.push(cell); cell = ""; } else cell += char; } cells.push(cell); return cells; }
function validEmailValue(value: string | undefined) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? "").trim()); }

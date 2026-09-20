"use client";

import { useState, type ChangeEvent } from "react";
import { ClipboardCheck, Upload } from "lucide-react";

type Data = {
  subjects: Array<{ id: string; title: string; description: string; color: string; isActive: boolean }>;
  batches: Array<{ id: string; subjectId: string; name: string; members: number }>;
  exams: Array<{ id: string; subjectId: string; title: string; questionCount: number; durationSeconds: number; batchIds: string[] }>;
};

export function McqAdmin({ data, onChanged, setError }: { data: Data; onChanged: (next: Data) => void; setError: (value: string) => void }) {
  const [subjectId, setSubjectId] = useState("ai-services"); const [batchId, setBatchId] = useState(""); const [title, setTitle] = useState(""); const [duration, setDuration] = useState("30");
  const importExam = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return; setError("");
    const records = parseImport(await file.text());
    if (!records.length) { setError("The MCQ file has no readable rows."); return; }
    const response = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "mcq-import", subjectId, batchId, examTitle: title, durationSeconds: Number(duration) * 60, records }) });
    const payload = await response.json() as Data & { error?: string }; if (!response.ok) setError(payload.error ?? "Could not import MCQs."); else { onChanged(payload); setTitle(""); event.target.value = ""; }
  };
  const batches = data.batches.filter((batch) => batch.subjectId === subjectId);
  return <article className="panel admin-card"><div className="panel-head"><div><p className="eyebrow">MCQ assessments</p><h2>Import and assign exam</h2></div><ClipboardCheck /></div><select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setBatchId(""); }}><option value="">Select subject</option>{data.subjects.filter((subject) => subject.isActive).map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}</select><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Exam title" /><input value={duration} onChange={(event) => setDuration(event.target.value)} type="number" min="1" placeholder="Duration in minutes" /><select value={batchId} onChange={(event) => setBatchId(event.target.value)}><option value="">All enrolled learners in subject</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name} ({batch.members})</option>)}</select><label className="file-import">Import MCQ CSV/JSON <Upload /><input type="file" accept=".csv,.json,text/csv,application/json" onChange={importExam} /></label><small>Required columns: <code>question,option1,option2,option3,option4,correctOption,subject</code>. Optional: <code>option5,explanation</code>.</small><div className="admin-list">{data.exams.map((exam) => <div key={exam.id}><span>{exam.title}<small>{exam.questionCount} questions · {exam.batchIds.length ? `${exam.batchIds.length} batch assignment` : "all subject learners"}</small></span></div>)}</div></article>;
}

function parseImport(text: string): Array<Record<string, string>> {
  try { const json = JSON.parse(text); if (Array.isArray(json)) return json.filter((row): row is Record<string, string> => Boolean(row) && typeof row === "object"); } catch { /* CSV fallback */ }
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map(parseCsvLine); const headers = rows.shift()?.map((cell) => cell.trim().toLowerCase()) ?? [];
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]))).filter((row) => Object.values(row).some(Boolean));
}
function parseCsvLine(line: string) { const cells: string[] = []; let cell = "", quoted = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { cell += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { cells.push(cell); cell = ""; } else cell += char; } cells.push(cell); return cells; }

import type { Concept } from "@/lib/content";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9@+./ -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const labelFor = (group: string[]) =>
  group[0]
    .replace(/`/g, "")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function scoreAnswer(answer: string, concept: Concept) {
  const normalized = normalize(answer);
  const groups = concept.keywords;
  const matchedGroups = groups.filter((group) =>
    group.some((alternative) => normalized.includes(normalize(alternative))),
  );
  const missingGroups = groups.filter((group) => !matchedGroups.includes(group));
  const coverage = groups.length ? matchedGroups.length / groups.length : 0;
  const wordCount = normalized.split(" ").filter(Boolean).length;
  const detailBonus = wordCount >= 45 ? 10 : wordCount >= 25 ? 7 : wordCount >= 12 ? 3 : 0;
  const score = Math.min(100, Math.round(coverage * 90 + detailBonus));

  let summary = "Start by naming the idea clearly, then explain how it works and why it fits the situation.";
  if (score >= 85) summary = "Strong answer: you covered the important mechanism and the reason it matters.";
  else if (score >= 70) summary = "Clear pass: the main idea is correct. Add the missing points to make it interview-ready.";
  else if (score >= 45) summary = "You have part of the idea. Connect the mechanism, decision rule and practical reason more explicitly.";

  return {
    score,
    cleared: score >= 70,
    matched: matchedGroups.map(labelFor),
    missing: missingGroups.map(labelFor),
    matchedCount: matchedGroups.length,
    totalCount: groups.length,
    wordCount,
    summary,
  };
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { recordAttempt } from "@/db/arena";
import { getConcept, getQuestion } from "@/lib/content";
import { scoreAnswer } from "@/lib/scoring";
import { userCatalog } from "@/db/classroom";

const payloadSchema = z.object({
  questionId: z.string().min(1).max(100),
  answer: z.string().trim().min(10).max(6000),
  confidence: z.number().int().min(1).max(5),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const authenticated = await getChatGPTUser();
  const isDevelopment = process.env.NODE_ENV === "development";
  const user = authenticated ?? (isDevelopment ? {
    userId: "preview-learner",
    email: "preview@arena.local",
    displayName: "Preview Learner",
    fullName: "Preview Learner",
  } : null);
  if (!user) return NextResponse.json({ error: "Please sign in to save your answer." }, { status: 401 });

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Write at least a short paragraph and choose your confidence." }, { status: 400 });
  }

  const question = getQuestion(parsed.data.questionId);
  const catalog = await userCatalog(user.email, user.subjectId);
  const managed = catalog?.questions.find((item) => item.id === parsed.data.questionId);
  if ((!question || (catalog.restricted && !catalog.subjectIds.includes(question.topicId))) && !managed) return NextResponse.json({ error: "Question not found or not assigned to you." }, { status: 404 });
  const concept = question ? getConcept(question.conceptKey) : null;
  if (question && !concept) return NextResponse.json({ error: "Learning concept not found." }, { status: 404 });

  const scoringConcept = concept ?? {
    key: managed!.id, title: managed!.prompt, answer: managed!.answer, why: managed!.why || "This model answer covers the required learning objectives.",
    keywords: managed!.keywords.length ? managed!.keywords : managed!.answer.split(/[.!?]/).filter(Boolean).slice(0, 4).map((value) => [value.trim().split(/\s+/).slice(0, 3).join(" ")]),
  };

  const result = scoreAnswer(parsed.data.answer, scoringConcept);
  await recordAttempt({
    user: { userId: user.userId, email: user.email, displayName: user.displayName },
    questionId: question?.id ?? managed!.id,
    topicId: question?.topicId ?? managed!.subjectId,
    source: question?.source ?? "Custom",
    answer: parsed.data.answer,
    score: result.score,
    matchedCount: result.matchedCount,
    totalCount: result.totalCount,
    confidence: parsed.data.confidence,
    localDate: parsed.data.localDate,
  });

  return NextResponse.json({
    ...result,
    questionId: question?.id ?? managed!.id,
    conceptTitle: scoringConcept.title,
    modelAnswer: scoringConcept.answer,
    why: scoringConcept.why,
  });
}

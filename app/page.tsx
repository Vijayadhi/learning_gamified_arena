import { ArenaApp } from "@/app/arena-client";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser, isStandaloneMode } from "@/app/chatgpt-auth";
import { emptyDashboard, ensureUser, getDashboard } from "@/db/arena";
import { isFacilitator } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authenticated = await getChatGPTUser();
  const previewUser = process.env.NODE_ENV === "development" ? {
    userId: "preview-learner",
    email: "preview@arena.local",
    displayName: "Preview Learner",
    fullName: "Preview Learner",
  } : null;
  const user = authenticated ?? previewUser;

  if (!user) {
    return (
      <main className="login-shell">
        <div className="login-grid" aria-hidden="true" />
        <section className="login-card">
          <div className="brand-mark"><span>AI</span></div>
          <p className="eyebrow">AI Services • Gladiator Arena</p>
          <h1>Learn it. Explain it. Clear the arena.</h1>
          <p className="login-copy">Master 152 real interview questions through guided concepts, paragraph challenges, instant explanations, streaks and a live progress dashboard.</p>
          <div className="login-stats">
            <span><strong>12</strong> learning tracks</span><span><strong>152</strong> challenges</span><span><strong>70%</strong> clear score</span>
          </div>
          <a className="login-button" href={chatGPTSignInPath("/")} target="_top">Continue with email <span aria-hidden="true">→</span></a>
          <p className="privacy-note">{isStandaloneMode() ? "Only emails listed by the facilitator can enter. This arena never stores a password." : "Your verified account email identifies your progress. This arena never stores a password."}</p>
        </section>
      </main>
    );
  }

  let dashboard = emptyDashboard();
  try {
    await ensureUser(user);
    dashboard = await getDashboard(user.userId);
  } catch (error) {
    console.error("Dashboard initialization failed", error);
  }

  return <ArenaApp user={{ email: user.email, displayName: user.displayName }} initialDashboard={dashboard} signOutPath={chatGPTSignOutPath("/")} isFacilitator={isFacilitator(user)} />;
}

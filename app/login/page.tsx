import Link from "next/link";
import { redirect } from "next/navigation";
import { getChatGPTUser, isStandaloneMode } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ return_to?: string; error?: string; admin?: string }>;
}) {
  if (!isStandaloneMode()) redirect("/");
  if (await getChatGPTUser()) redirect("/");
  const params = await searchParams;
  const adminMode = params.admin === "1";
  return <main className="login-shell">
    <div className="login-grid" aria-hidden="true" />
    <section className="login-card email-login-card">
      <div className="brand-mark"><span>AI</span></div>
      <p className="eyebrow">{adminMode ? "Administrator access" : "Authorized learner access"}</p>
      <h1>{adminMode ? "Admin sign in" : "Enter the arena"}</h1>
      <p className="login-copy">{adminMode ? "Use your administrator email and password." : "Use your assigned email and the active four-digit course access code."}</p>
      {params.error && <p className="login-error">{params.error}</p>}
      <form action="/api/auth/login" method="post" className="email-login-form">
        <input type="hidden" name="return_to" value={params.return_to ?? "/"} />
        <input type="hidden" name="mode" value={adminMode ? "admin" : "learner"} />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="name@example.com" />
        {adminMode ? <><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" /></> : <><label htmlFor="access_code">4-digit access code</label><input id="access_code" name="access_code" type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="1234" /></>}
        <button type="submit">Continue to arena <span aria-hidden="true">→</span></button>
      </form>
      <p className="privacy-note">{adminMode ? <Link href="/login">Learner sign in</Link> : <Link href="/login?admin=1">Administrator sign in</Link>} · Your email is used only to separate progress and scores within this classroom.</p>
    </section>
  </main>;
}

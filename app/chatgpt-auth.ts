import { env } from "cloudflare:workers";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isActiveLearner } from "@/db/classroom";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  role?: "learner" | "admin";
  subjectId?: string;
};

const COOKIE_NAME = "arena_session";
const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_FULL_NAME_ENCODING_HEADER = "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";

function runtimeEnv() {
  return env as unknown as Record<string, string | undefined>;
}

export function isStandaloneMode() {
  return runtimeEnv().STANDALONE_MODE === "true";
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (userId && email) {
    const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
    const fullName = encodedFullName && requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName) : null;
    return { userId, displayName: fullName ?? email, email, fullName };
  }

  if (!isStandaloneMode()) return null;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifyStandaloneSession(token) : null;
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return isStandaloneMode()
    ? `/login?return_to=${encodeURIComponent(safeReturnTo)}`
    : `/signin-with-chatgpt?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return isStandaloneMode()
    ? `/logout?return_to=${encodeURIComponent(safeReturnTo)}`
    : `/signout-with-chatgpt?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export async function isAllowedStandaloneEmail(value: string) {
  const email = localNormalizeEmail(value);
  if (!email) return false;
  try { if (await isActiveLearner(email)) return true; } catch { /* legacy file fallback before migration */ }
  const settings = runtimeEnv();
  if (settings.ALLOW_ALL_LEARNERS === "true") return true;
  return allowedEmails().has(email) || facilitatorEmails().has(email);
}

export function facilitatorEmails() {
  return new Set((runtimeEnv().FACILITATOR_EMAILS ?? "").split(",").map(localNormalizeEmail).filter(Boolean));
}

function allowedEmails() {
  try {
    const parsed = JSON.parse(runtimeEnv().ALLOWED_LEARNER_EMAILS_JSON ?? "[]");
    return new Set((Array.isArray(parsed) ? parsed : []).map((item) => localNormalizeEmail(String(item))).filter(Boolean));
  } catch {
    return new Set<string>();
  }
}

export async function createStandaloneSession(emailValue: string, role: "learner" | "admin" = "learner", subjectId?: string) {
  const email = localNormalizeEmail(emailValue);
  if (!email || (role === "learner" && !(await isAllowedStandaloneEmail(email)))) throw new Error("This email is not on the learner list.");
  const payload = JSON.stringify({ email, role, subjectId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14 });
  const encoded = base64UrlEncode(payload);
  const signature = await sign(encoded);
  return `${encoded}.${signature}`;
}

export function standaloneCookie(value: string) {
  return { name: COOKIE_NAME, value, httpOnly: true, sameSite: "lax" as const, secure: runtimeEnv().COOKIE_SECURE !== "false", path: "/", maxAge: 60 * 60 * 24 * 14 };
}

export function expiredStandaloneCookie() {
  return { name: COOKIE_NAME, value: "", httpOnly: true, sameSite: "lax" as const, secure: runtimeEnv().COOKIE_SECURE !== "false", path: "/", maxAge: 0 };
}

async function verifyStandaloneSession(token: string): Promise<ChatGPTUser | null> {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !(await timingSafeEqual(signature, await sign(encoded)))) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as { email?: string; role?: "learner" | "admin"; subjectId?: string; expiresAt?: number };
    const email = localNormalizeEmail(payload.email ?? "");
    if (!email || !payload.expiresAt || payload.expiresAt < Date.now() || (payload.role !== "admin" && !(await isAllowedStandaloneEmail(email)))) return null;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
    const stableId = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
    return { userId: `standalone:${stableId}`, email, displayName: displayName(email), fullName: null, role: payload.role ?? "learner", subjectId: payload.subjectId };
  } catch { return null; }
}

async function sign(value: string) {
  const secret = runtimeEnv().SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function base64UrlEncode(value: string) { return bytesToBase64Url(new TextEncoder().encode(value)); }
function base64UrlDecode(value: string) { const base64 = value.replace(/-/g, "+").replace(/_/g, "/"); const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "="); return new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))); }
function bytesToBase64Url(bytes: Uint8Array) { let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function localNormalizeEmail(value: string) { const email = value.trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ""; }
function displayName(email: string) { return email.split("@")[0].split(/[._-]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try { const url = new URL(value, "https://app.local"); return url.origin === "https://app.local" ? `${url.pathname}${url.search}${url.hash}` : "/"; }
  catch { return "/"; }
}

function safeDecodeURIComponent(value: string): string | null { try { return decodeURIComponent(value); } catch { return null; } }

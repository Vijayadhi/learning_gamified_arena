import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const learnersFile = process.env.LEARNERS_FILE || path.join(projectRoot, "config/learners.json");
const secretsFile = path.join(projectRoot, "dist/server/.dev.vars");
const secret = process.env.SESSION_SECRET || "";

if (secret.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters. Update the .env file before starting.");
}

const parsed = JSON.parse(readFileSync(learnersFile, "utf8"));
const rawLearners = Array.isArray(parsed) ? parsed : parsed.learners;
if (!Array.isArray(rawLearners)) {
  throw new Error("config/learners.json must be a JSON array of email addresses.");
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const learners = [...new Set(rawLearners.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
const invalid = learners.filter((email) => !emailPattern.test(email));
if (invalid.length) throw new Error(`Invalid learner email(s): ${invalid.join(", ")}`);

const facilitatorEmails = (process.env.FACILITATOR_EMAILS || "")
  .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
if (!facilitatorEmails.length || facilitatorEmails.some((email) => !emailPattern.test(email))) {
  throw new Error("FACILITATOR_EMAILS must contain at least one valid email address.");
}

const runtimeValues = {
  STANDALONE_MODE: "true",
  SESSION_SECRET: secret,
  FACILITATOR_EMAILS: facilitatorEmails.join(","),
  ALLOWED_LEARNER_EMAILS_JSON: JSON.stringify(learners),
  ALLOW_ALL_LEARNERS: process.env.ALLOW_ALL_LEARNERS === "true" ? "true" : "false",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "false" ? "false" : "true",
};
writeFileSync(secretsFile, `${Object.entries(runtimeValues).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n")}\n`, { mode: 0o600 });
console.log(`Authorized ${learners.length} learner email(s) and ${facilitatorEmails.length} facilitator email(s).`);

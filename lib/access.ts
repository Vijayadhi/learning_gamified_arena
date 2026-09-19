import { facilitatorEmails } from "@/app/chatgpt-auth";

export function isFacilitator(user: { userId: string; email: string; role?: "learner" | "admin" }) {
  return user.role === "admin" || facilitatorEmails().has(user.email.trim().toLowerCase());
}

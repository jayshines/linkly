import { redirect } from "next/navigation";
import { currentUserId, devLoginEnabled, githubConfigured } from "@/lib/auth";
import { LoginCard } from "./login-card";

export const metadata = { title: "Log in | Linkly" };

export default async function LoginPage() {
  if (await currentUserId()) redirect("/dashboard");
  return <LoginCard devLogin={devLoginEnabled} githubReady={githubConfigured} />;
}

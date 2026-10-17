import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { suggestUsername } from "@/lib/validators";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Choose your username | Linkly" };

export default async function OnboardingPage() {
  const id = await currentUserId();
  if (!id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id },
    select: { username: true, name: true, email: true },
  });
  if (!user) redirect("/login");
  if (user.username) redirect("/dashboard");

  // Suggest a handle from the display name, falling back to the email prefix
  const suggestion =
    suggestUsername(user.name) || suggestUsername(user.email?.split("@")[0]);

  return <OnboardingForm suggestion={suggestion} />;
}

import { LinkList } from "@/components/editor/link-list";
import { ProfilePanel } from "@/components/editor/profile-panel";

export const metadata = { title: "Links | Linkly" };

export default function LinksPage() {
  return (
    <div className="animate-rise space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Links</h1>
        <p className="mt-1 text-sm text-muted">Add, reorder and switch links on or off. Changes save automatically.</p>
      </div>
      <ProfilePanel />
      <LinkList />
    </div>
  );
}

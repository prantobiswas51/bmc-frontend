import { getContext } from "@/lib/context";
import { Topbar } from "./topbar";

/** Page title + search + organization switcher + user, for every panel page. */
export async function PageHeader({ title }: { title: string }) {
  const { me, orgs, org } = await getContext();
  return <Topbar title={title} me={me} orgs={orgs} org={org} />;
}

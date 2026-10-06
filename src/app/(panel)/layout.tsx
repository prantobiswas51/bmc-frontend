import { Sidebar } from "@/components/sidebar";
import { can, getContext } from "@/lib/context";
import { CreateOrgCard } from "@/components/create-org";

export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const { me, org } = await getContext();
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        platformRole={me.platformRole}
        canClaim={can(org, "owner")}
        hasOrg={!!org}
      />
      <main className="min-w-0 flex-1 p-4 pt-5 sm:p-6 lg:p-8">
        {org || me.platformRole ? children : <CreateOrgCard name={me.name} />}
      </main>
    </div>
  );
}

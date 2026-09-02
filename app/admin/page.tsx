import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminOverview } from "@/lib/album-data";
import AdminClient from "@/components/AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/album");

  const overview = await getAdminOverview();
  return <AdminClient overview={overview} adminName={session.name} />;
}

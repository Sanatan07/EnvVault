import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardRootPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Redirect to the user's first org; the client-side will handle fetching
  redirect("/orgs");
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/album");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="register" />
    </main>
  );
}

import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { safeNextPath } from "@/lib/format";

export const metadata: Metadata = { title: "Create Account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const session = await getSession();
  return (
    <main>
      <SiteHeader session={session ? { name: session.name, role: session.role } : null} />
      <AuthForm mode="register" next={safeNextPath(params.next, "/book")} />
      <SiteFooter />
    </main>
  );
}

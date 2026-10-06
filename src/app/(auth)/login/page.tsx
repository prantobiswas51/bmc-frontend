import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { expired } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-medium text-brand-600">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Log in to manage your devices.
      </p>
      {expired && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Your session expired. Please log in again.
        </p>
      )}
      <AuthForm mode="login" />
    </>
  );
}

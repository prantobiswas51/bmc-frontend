import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-medium text-brand-600">
        Create your account
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        You can create an organization or join one after signing up.
      </p>
      <AuthForm mode="register" />
    </>
  );
}

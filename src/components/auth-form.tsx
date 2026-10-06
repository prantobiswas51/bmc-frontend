"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register } from "@/lib/actions";
import { input, label } from "./styles";
import { FormError, SubmitButton } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action] = useActionState(
    mode === "login" ? login : register,
    null,
  );
  const values: Record<string, string> = state?.values ?? {};

  return (
    <form action={action} className="space-y-4">
      {mode === "register" && (
        <label className={label}>
          <span>Name</span>
          <input
            name="name"
            required
            maxLength={255}
            autoComplete="name"
            defaultValue={values.name}
            className={input}
          />
        </label>
      )}
      <label className={label}>
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={values.email}
          className={input}
        />
      </label>
      <label className={label}>
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          className={input}
        />
      </label>
      <FormError state={state} />
      <div className="flex items-center justify-between gap-4 pt-2">
        <SubmitButton>
          {mode === "login" ? "Log in" : "Create account"}
        </SubmitButton>
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="text-sm text-brand-700 hover:underline"
        >
          {mode === "login"
            ? "Create an account"
            : "Already registered? Log in"}
        </Link>
      </div>
    </form>
  );
}

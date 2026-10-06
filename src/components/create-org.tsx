"use client";

import { useActionState } from "react";
import { createOrg } from "@/lib/actions";
import { card, input, label } from "./styles";
import { FormError, SubmitButton } from "./ui";

/** First run: a user with no organization creates one (and becomes its owner). */
export function CreateOrgCard({ name }: { name: string }) {
  const [state, action] = useActionState(createOrg, null);
  return (
    <div className={`${card} mx-auto mt-16 max-w-lg p-8`}>
      <h1 className="text-2xl font-medium text-brand-600">
        Welcome, {name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Create an organization for your home or company. You&apos;ll be its
        owner and can invite others. If someone invited you, ask them to add
        your email instead.
      </p>
      <form action={action} className="mt-6 space-y-4">
        <label className={label}>
          <span>Organization name</span>
          <input
            name="name"
            required
            maxLength={255}
            placeholder="e.g. Biswas Home"
            className={input}
          />
        </label>
        <FormError state={state} />
        <SubmitButton>Create organization</SubmitButton>
      </form>
    </div>
  );
}

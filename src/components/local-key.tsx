"use client";

import { Check, Copy, EyeOff, KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { getLocalKey } from "@/lib/actions";
import { button, card, cardTitle } from "./styles";

/**
 * The key for the device's local API (its own hotspot or your Wi-Fi, no internet needed).
 * The BongoMaker app fetches it by itself; this is for trying things in a browser.
 */
export function LocalKey({ deviceId }: { deviceId: string }) {
  const [key, setKey] = useState<string>();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function reveal() {
    startTransition(async () => {
      const result = await getLocalKey(deviceId);
      setKey(result.key);
      setError(result.error);
    });
  }

  async function copy() {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy automatically. Select the key and copy it by hand.");
    }
  }

  return (
    <section className={`${card} space-y-3`} aria-labelledby="local-key-title">
      <h2 id="local-key-title" className={cardTitle}>
        Local control key
      </h2>
      <p className="text-sm text-muted">
        Lets you control this light with no internet, from its own Wi-Fi or your
        home network. On the light&apos;s page, paste it into the
        &ldquo;Device key&rdquo; box. Keep it private.
      </p>
      {key ? (
        <div className="space-y-2">
          <code
            data-testid="local-key"
            className="block break-all rounded-xl border border-line bg-cream px-3 py-2 font-mono text-sm"
          >
            {key}
          </code>
          <div className="flex gap-2">
            <button type="button" className={button.secondary} onClick={copy}>
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              className={button.ghost}
              onClick={() => setKey(undefined)}
            >
              <EyeOff className="h-4 w-4" aria-hidden />
              Hide
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={button.secondary}
          onClick={reveal}
          disabled={pending}
        >
          <KeyRound className="h-4 w-4" aria-hidden />
          {pending ? "Loading…" : "Show key"}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
    </section>
  );
}

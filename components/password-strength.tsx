"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "a lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "an uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "a number", test: (v: string) => /\d/.test(v) },
];

/** Returns a human message when the password fails our policy, else null. */
export function describePasswordIssue(value: string): string | null {
  const missing = RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
  if (missing.length === 0) return null;
  return `Password needs ${missing.join(", ")}.`;
}

export function PasswordStrength({ value }: { value: string }) {
  const score = useMemo(() => RULES.filter((rule) => rule.test(value)).length, [value]);
  if (!value) return null;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1" aria-hidden="true">
        {RULES.map((rule, index) => (
          <span
            key={rule.label}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < score ? (score >= 4 ? "bg-primary" : "bg-amber-500") : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        {labels[score]}
        {score < RULES.length ? ` — add ${RULES.filter((r) => !r.test(value)).map((r) => r.label).join(", ")}.` : " password."}
      </p>
    </div>
  );
}

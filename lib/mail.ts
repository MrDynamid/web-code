/**
 * Transactional email with a graceful development fallback.
 *
 * If RESEND_API_KEY is set we send a real email via Resend's REST API (called
 * with `fetch` so no extra dependency is needed). If it isn't set, sending
 * would silently black-hole the password-reset flow — so in development we
 * stash the most recent link in memory instead, and the sign-in page reads it
 * back so the reset journey still completes end to end.
 *
 * The in-memory store is deliberately dev-only: exposing a reset link without
 * proving control of the inbox would be an account-takeover hole in production.
 */

const isDev = process.env.NODE_ENV !== "production";

type DevLink = { url: string; createdAt: number };

// Survives HMR in dev so the link isn't lost when a module reloads.
const globalForMail = globalThis as unknown as { __devResetLinks?: Map<string, DevLink> };
const devResetLinks = (globalForMail.__devResetLinks ??= new Map<string, DevLink>());

const DEV_LINK_TTL_MS = 60 * 60 * 1000; // Match Better Auth's 1 hour token life.

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function rememberDevResetLink(email: string, url: string): void {
  if (!isDev) return;
  devResetLinks.set(normalizeEmail(email), { url, createdAt: Date.now() });
}

export function readDevResetLink(email: string): string | null {
  if (!isDev) return null;
  const key = normalizeEmail(email);
  const entry = devResetLinks.get(key);
  if (!entry) return null;
  // Expire alongside the token so we never hand back a link that won't work.
  if (Date.now() - entry.createdAt > DEV_LINK_TTL_MS) {
    devResetLinks.delete(key);
    return null;
  }
  return entry.url;
}

/** True when a real provider is configured, so callers can adjust their copy. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends the password-reset email. Returns whether a real email went out so the
 * caller can decide what to tell the user.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  url: string;
}): Promise<{ delivered: boolean }> {
  const { to, url } = params;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    rememberDevResetLink(to, url);
    console.log(`[mail] RESEND_API_KEY not set. Password reset link for ${to}: ${url}`);
    return { delivered: false };
  }

  // `onboarding@resend.dev` works without domain verification, which keeps this
  // functional before the store has its own sending domain.
  const from = process.env.EMAIL_FROM ?? "MEHR <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your MEHR password",
        html: resetEmailHtml(url),
        text: `Reset your MEHR password by opening this link (it expires in one hour):\n\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[mail] Resend rejected the send (${response.status}): ${detail}`);
      // Fall back to the dev link so a misconfigured key doesn't dead-end the
      // flow while someone is still setting the store up.
      rememberDevResetLink(to, url);
      return { delivered: false };
    }

    return { delivered: true };
  } catch (error) {
    console.error("[mail] Failed to reach Resend", error);
    rememberDevResetLink(to, url);
    return { delivered: false };
  }
}

function resetEmailHtml(url: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#faf7f2;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2b2118">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fffdfa;border-radius:12px;padding:32px">
      <tr>
        <td>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:600">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5c5043">
            We received a request to reset the password for your MEHR account. This link expires in one hour.
          </p>
          <a href="${url}" style="display:inline-block;background:#2b2118;color:#fffdfa;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px">
            Choose a new password
          </a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a7d6d">
            If you didn't request this, you can safely ignore this email &mdash; your password won't change.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

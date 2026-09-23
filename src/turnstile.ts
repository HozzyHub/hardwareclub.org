export interface TurnstileVerifier {
  verify(token: string, secret: string, ip: string | null): Promise<boolean>;
}

async function verifyWithCloudflare(token: string, secret: string, ip: string | null): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { success?: boolean } | null;
    return data?.success === true;
  } catch (err) {
    console.error("Turnstile siteverify request failed", err);
    return false;
  }
}

/**
 * A mutable singleton so tests running through SELF.fetch() (same isolate)
 * can stub verification without real network calls.
 */
export const turnstile: TurnstileVerifier = {
  verify: verifyWithCloudflare,
};

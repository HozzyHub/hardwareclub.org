import { APEX_HOST } from "./site";

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  // X-Frame-Options covers older browsers; frame-ancestors is the CSP
  // equivalent and is not inherited from default-src.
  "frame-ancestors 'none'",
  "form-action 'self'",
].join("; ");

export function withSecurityHeaders(response: Response, hostname: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", CSP);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), browsing-topics=()",
  );
  // Isolates the browsing context from cross-origin openers; Turnstile runs in
  // an iframe, not a popup, so it is unaffected.
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("X-Frame-Options", "DENY");
  // HSTS is scoped to the apex only; includeSubDomains/preload are
  // deliberately off so other subdomains aren't pinned to HTTPS.
  if (hostname === APEX_HOST) {
    headers.set("Strict-Transport-Security", "max-age=31536000");
  } else {
    headers.delete("Strict-Transport-Security");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

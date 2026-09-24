import { BodyTooLargeError, parseBody, wantsJson, withBodyLimit } from "./body";
import { notifier } from "./email";
import { turnstile } from "./turnstile";
import { validateSubmission, type ValidationErrors } from "./validate";

const MAX_BODY_BYTES = 16 * 1024;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function successResponse(request: Request, asJson: boolean): Response {
  if (asJson) {
    return Response.json({ ok: true });
  }
  const thanksUrl = new URL("/thanks", request.url);
  return Response.redirect(thanksUrl.toString(), 303);
}

function errorResponse(errors: ValidationErrors, status: number, asJson: boolean): Response {
  if (asJson) {
    return Response.json({ ok: false, errors }, { status });
  }
  const items = Object.values(errors)
    .map((message) => `<li>${escapeHtml(message)}</li>`)
    .join("");
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>There was a problem · Hardware Club</title></head>
<body>
<main>
<h1>There was a problem with your submission</h1>
<ul>${items}</ul>
<p><a href="/#donate">Back to the form</a></p>
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function handleSubmit(request: Request, env: Env): Promise<Response> {
  const asJson = wantsJson(request);

  let raw;
  try {
    raw = await parseBody(await withBodyLimit(request, MAX_BODY_BYTES));
  } catch (err) {
    if (err instanceof BodyTooLargeError) {
      return errorResponse({ form: "That submission is too large." }, 413, asJson);
    }
    return errorResponse({ form: "We couldn't read that submission. Please try again." }, 400, asJson);
  }

  // Honeypot: respond exactly as success, store nothing.
  if (raw.website.trim() !== "") {
    return successResponse(request, asJson);
  }

  const ip = request.headers.get("cf-connecting-ip");
  const verified = await turnstile.verify(raw.turnstileToken, env.TURNSTILE_SECRET, ip);
  if (!verified) {
    return errorResponse({ turnstile: "We couldn't verify you're human. Please try again." }, 400, asJson);
  }

  const result = validateSubmission(raw);
  if (!result.ok) {
    return errorResponse(result.errors, 400, asJson);
  }

  const { data } = result;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const country = (request.cf as { country?: string } | undefined)?.country ?? null;
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 200);

  try {
    await env.DB.prepare(
      `INSERT INTO submissions
        (id, created_at, name, email, phone, location, categories, description, quantity, powers_on, handoff, drive_back, consent, country, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        createdAt,
        data.name,
        data.email,
        data.phone,
        data.location,
        JSON.stringify(data.categories),
        data.description,
        data.quantity,
        data.powers_on,
        data.handoff,
        data.drive_back ? 1 : 0,
        data.consent ? 1 : 0,
        country,
        userAgent,
      )
      .run();
  } catch (err) {
    console.error("Failed to store donation submission", err);
    return errorResponse({ form: "We couldn't save your submission. Please try again in a moment." }, 500, asJson);
  }

  try {
    await notifier.send(env, data);
  } catch (err) {
    console.error("Failed to send donation notification email", err);
  }

  return successResponse(request, asJson);
}

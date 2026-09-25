import { serveIndex } from "./html";
import { withSecurityHeaders } from "./security";
import { APEX_HOST, WWW_HOST } from "./site";
import { handleSubmit } from "./submit";
import { turnstileConfigProblem } from "./turnstile";

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    // Donor PII must never travel over plaintext: send www and any http://
    // request on the production hosts to the https apex. Other hosts (e.g.
    // `wrangler dev` on localhost) are left alone.
    if (url.hostname === WWW_HOST || (url.hostname === APEX_HOST && url.protocol === "http:")) {
      url.protocol = "https:";
      url.hostname = APEX_HOST;
      return withSecurityHeaders(Response.redirect(url.toString(), 301));
    }

    let response: Response;

    if (url.pathname === "/api/health") {
      const problem = turnstileConfigProblem(env, url.hostname);
      if (problem) console.error(`Turnstile misconfigured: ${problem}`);
      response = Response.json({ ok: !problem }, { status: problem ? 503 : 200 });
    } else if (url.pathname === "/api/submit" && request.method === "POST") {
      response = await handleSubmit(request, env);
    } else if (url.pathname === "/" || url.pathname === "/index.html") {
      response = await serveIndex(request, env.ASSETS, env.TURNSTILE_SITEKEY);
    } else {
      response = await env.ASSETS.fetch(request);
    }

    return withSecurityHeaders(response);
  },
} satisfies ExportedHandler<Env>;

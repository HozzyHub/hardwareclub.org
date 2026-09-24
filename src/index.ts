import { serveIndex } from "./html";
import { withSecurityHeaders } from "./security";
import { handleSubmit } from "./submit";

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "www.hardwareclub.org") {
      url.hostname = "hardwareclub.org";
      return Response.redirect(url.toString(), 301);
    }

    let response: Response;

    if (url.pathname === "/api/health") {
      response = Response.json({ ok: true });
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

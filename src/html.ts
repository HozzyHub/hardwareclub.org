class TurnstileSiteKeyInjector {
  constructor(private siteKey: string) {}

  element(element: Element) {
    element.setAttribute("data-sitekey", this.siteKey);
  }
}

const CONDITIONAL_REQUEST_HEADERS = ["if-none-match", "if-modified-since"];
const VALIDATOR_RESPONSE_HEADERS = ["etag", "last-modified"];

export interface AssetSource {
  fetch(request: Request): Promise<Response>;
}

export async function serveIndex(request: Request, assets: AssetSource, siteKey: string): Promise<Response> {
  const upstream = new Request(request);
  for (const name of CONDITIONAL_REQUEST_HEADERS) {
    upstream.headers.delete(name);
  }
  const asset = await assets.fetch(upstream);

  const headers = new Headers(asset.headers);
  for (const name of VALIDATOR_RESPONSE_HEADERS) {
    headers.delete(name);
  }
  const uncacheable = new Response(asset.body, {
    status: asset.status,
    statusText: asset.statusText,
    headers,
  });

  return new HTMLRewriter()
    .on(".cf-turnstile", new TurnstileSiteKeyInjector(siteKey))
    .transform(uncacheable);
}

class TurnstileSiteKeyInjector {
  constructor(private siteKey: string) {}

  element(element: Element) {
    element.setAttribute("data-sitekey", this.siteKey);
  }
}

export function injectTurnstileSiteKey(response: Response, siteKey: string): Response {
  return new HTMLRewriter()
    .on(".cf-turnstile", new TurnstileSiteKeyInjector(siteKey))
    .transform(response);
}

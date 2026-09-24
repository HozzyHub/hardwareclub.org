export interface RawSubmission {
  name: string;
  email: string;
  phone: string;
  location: string;
  categories: string[];
  description: string;
  quantity: string;
  powers_on: string;
  handoff: string;
  drive_back: boolean;
  consent: boolean;
  website: string;
  turnstileToken: string;
}

function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function truthy(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === "yes" || value === 1 || value === "1";
}

function formStr(value: File | string | null): string {
  return typeof value === "string" ? value : "";
}

export function wantsJson(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  return accept.includes("application/json") || contentType.includes("application/json");
}

export class BodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Request body exceeds ${maxBytes} bytes`);
    this.name = "BodyTooLargeError";
  }
}

export async function withBodyLimit(request: Request, maxBytes: number): Promise<Request> {
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > maxBytes) {
    throw new BodyTooLargeError(maxBytes);
  }
  if (request.body === null) {
    return request;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of request.body as ReadableStream<Uint8Array>) {
    total += chunk.byteLength;
    if (total > maxBytes) {
      throw new BodyTooLargeError(maxBytes);
    }
    chunks.push(chunk);
  }

  const buffered = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffered.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request.url, { method: request.method, headers: request.headers, body: buffered });
}

export async function parseBody(request: Request): Promise<RawSubmission> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return {
      name: str(json.name),
      email: str(json.email),
      phone: str(json.phone),
      location: str(json.location),
      categories: Array.isArray(json.categories) ? json.categories.map(String) : [],
      description: str(json.description),
      quantity: str(json.quantity),
      powers_on: str(json.powers_on),
      handoff: str(json.handoff),
      drive_back: truthy(json.drive_back),
      consent: truthy(json.consent),
      website: str(json.website),
      turnstileToken: str(json["cf-turnstile-response"]),
    };
  }

  const formData = await request.formData();
  return {
    name: formStr(formData.get("name")),
    email: formStr(formData.get("email")),
    phone: formStr(formData.get("phone")),
    location: formStr(formData.get("location")),
    categories: formData.getAll("categories[]").map(String),
    description: formStr(formData.get("description")),
    quantity: formStr(formData.get("quantity")),
    powers_on: formStr(formData.get("powers_on")),
    handoff: formStr(formData.get("handoff")),
    drive_back: formData.get("drive_back") != null,
    consent: formData.get("consent") != null,
    website: formStr(formData.get("website")),
    turnstileToken: formStr(formData.get("cf-turnstile-response")),
  };
}

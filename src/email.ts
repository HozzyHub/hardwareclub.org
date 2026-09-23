import { EmailMessage } from "cloudflare:email";
import { createMimeMessage, Mailbox } from "mimetext";
import type { NormalizedSubmission } from "./validate";

const FROM_ADDRESS = "hello@hardwareclub.org";

function formatSubject(data: NormalizedSubmission): string {
  return `New hardware offer: ${data.categories.join(", ")} in ${data.location}`;
}

function formatBody(data: NormalizedSubmission): string {
  return [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone ?? "(not provided)"}`,
    `Location: ${data.location}`,
    `Categories: ${data.categories.join(", ")}`,
    `Quantity: ${data.quantity}`,
    `Powers on: ${data.powers_on}`,
    `Handoff: ${data.handoff}`,
    `Wants drive back: ${data.drive_back ? "yes" : "no"}`,
    "",
    "Description:",
    data.description,
  ].join("\n");
}

function toBase64Lines(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/.{76}(?=.)/g, "$&\r\n");
}

export function buildRawMessage(to: string, data: NormalizedSubmission): string {
  const msg = createMimeMessage();
  msg.setSender({ name: "Hardware Club", addr: FROM_ADDRESS });
  msg.setRecipient(to);
  msg.setSubject(formatSubject(data));
  msg.setHeader("Reply-To", new Mailbox({ addr: data.email }));
  msg.addMessage({
    contentType: "text/plain",
    encoding: "base64",
    data: toBase64Lines(formatBody(data)),
  });
  return msg.asRaw();
}

async function sendViaBinding(env: Env, data: NormalizedSubmission): Promise<void> {
  if (!env.NOTIFY) {
    console.log("NOTIFY binding unavailable; would have sent email.", {
      to: env.NOTIFY_TO,
      subject: formatSubject(data),
      body: formatBody(data),
    });
    return;
  }

  const raw = buildRawMessage(env.NOTIFY_TO, data);
  await env.NOTIFY.send(new EmailMessage(FROM_ADDRESS, env.NOTIFY_TO, raw));
}

export interface Notifier {
  send(env: Env, data: NormalizedSubmission): Promise<void>;
}

/**
 * A mutable singleton so tests running through SELF.fetch() (same isolate)
 * can spy on or stub notification sending.
 */
export const notifier: Notifier = {
  send: sendViaBinding,
};

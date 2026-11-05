import { EmailMessage } from "cloudflare:email";
import { createMimeMessage, Mailbox } from "mimetext";
import type { NormalizedSubmission } from "./validate";

const FROM_ADDRESS = "hello@hardwareclub.org";

function formatSubject(data: NormalizedSubmission): string {
  return `New hardware offer: ${data.categories.join(", ")} in ${data.location}`;
}

function formatBody(data: NormalizedSubmission, submissionId: string): string {
  return [
    // So the maintainer can delete this row after the handoff (README,
    // "Submission retention") without looking it up by email first.
    `Submission ID: ${submissionId}`,
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

export function buildRawMessage(to: string, data: NormalizedSubmission, submissionId: string): string {
  const msg = createMimeMessage();
  msg.setSender({ name: "Hardware Club", addr: FROM_ADDRESS });
  msg.setRecipient(to);
  msg.setSubject(formatSubject(data));
  msg.setHeader("Reply-To", new Mailbox({ addr: data.email }));
  msg.addMessage({
    contentType: "text/plain",
    encoding: "base64",
    data: toBase64Lines(formatBody(data, submissionId)),
  });
  return msg.asRaw();
}

async function sendViaBinding(env: Env, data: NormalizedSubmission, submissionId: string): Promise<void> {
  if (!env.NOTIFY) {
    console.log("NOTIFY binding unavailable; donation notification email skipped");
    return;
  }

  const raw = buildRawMessage(env.NOTIFY_TO, data, submissionId);
  await env.NOTIFY.send(new EmailMessage(FROM_ADDRESS, env.NOTIFY_TO, raw));
}

export interface Notifier {
  send(env: Env, data: NormalizedSubmission, submissionId: string): Promise<void>;
}

/**
 * A mutable singleton so tests running through SELF.fetch() (same isolate)
 * can spy on or stub notification sending.
 */
export const notifier: Notifier = {
  send: sendViaBinding,
};

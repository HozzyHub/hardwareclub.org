import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import type { NormalizedSubmission } from "./validate";

const FROM_ADDRESS = "hello@hardwareclub.org";
const TO_ADDRESS = "randalwadejr@gmail.com";

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

async function sendViaBinding(env: Env, data: NormalizedSubmission): Promise<void> {
  const subject = `New hardware offer: ${data.categories.join(", ")} in ${data.location}`;
  const body = formatBody(data);

  if (!env.NOTIFY) {
    console.log("NOTIFY binding unavailable; would have sent email.", { subject, body });
    return;
  }

  const msg = createMimeMessage();
  msg.setSender({ name: "Hardware Club", addr: FROM_ADDRESS });
  msg.setRecipient(TO_ADDRESS);
  msg.setSubject(subject);
  msg.setHeader("Reply-To", data.email);
  msg.addMessage({ contentType: "text/plain", data: body });

  const message = new EmailMessage(FROM_ADDRESS, TO_ADDRESS, msg.asRaw());
  await env.NOTIFY.send(message);
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

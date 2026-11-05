// Runs public/main.js (the donate form's progressive enhancement) against a
// small stub DOM and a stubbed fetch, and checks what a donor sees: the
// "Sending…" state, field errors, the form-level status, and the redirect.
// No browser or DOM library needed. Part of `npm run check`.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = await readFile(path.join(root, "public", "main.js"), "utf8");

// --- a minimal element with just the DOM surface main.js uses ---------------
class El {
  constructor(tag, attrs = {}, children = []) {
    this.tagName = tag.toUpperCase();
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this._text = "";
    this.hidden = "hidden" in attrs;
    this.disabled = false;
    this.dataset = {};
    this.listeners = {};
    for (const child of children) this.appendChild(child);
  }
  get name() {
    return this.attrs.name;
  }
  get id() {
    return this.attrs.id ?? "";
  }
  set id(v) {
    this.attrs.id = v;
  }
  get className() {
    return this.attrs.class ?? "";
  }
  set className(v) {
    this.attrs.class = v;
  }
  set tabIndex(v) {
    this.attrs.tabindex = String(v);
  }
  get textContent() {
    return this._text + this.children.map((c) => c.textContent).join("");
  }
  set textContent(v) {
    this._text = v;
    this.children = [];
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
  }
  getAttribute(k) {
    return k in this.attrs ? this.attrs[k] : null;
  }
  removeAttribute(k) {
    delete this.attrs[k];
  }
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  insertAdjacentElement(where, el) {
    if (where !== "afterend") throw new Error(`unsupported insertAdjacentElement(${where})`);
    const siblings = this.parent.children;
    el.parent = this.parent;
    siblings.splice(siblings.indexOf(this) + 1, 0, el);
  }
  focus() {
    focused = this;
  }
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  }
  matches(selector) {
    return selector.split(",").some((part) => matchesOne(this, part.trim()));
  }
  closest(selector) {
    for (let el = this; el; el = el.parent) if (el.matches(selector)) return el;
    return null;
  }
  *descendants() {
    for (const child of this.children) {
      yield child;
      yield* child.descendants();
    }
  }
  querySelectorAll(selector) {
    return [...this.descendants()].filter((el) => el.matches(selector));
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

// Supports `tag`, `.class`, `[attr="value"]` and combinations like
// `button[type="submit"]`: all that main.js asks for.
function matchesOne(el, selector) {
  const m = selector.match(/^([a-z]*)((?:\.[\w-]+)*)((?:\[[\w-]+="[^"]*"\])*)$/i);
  if (!m) throw new Error(`unsupported selector: ${selector}`);
  const [, tag, classes, attrs] = m;
  if (tag && el.tagName !== tag.toUpperCase()) return false;
  const own = el.className.split(/\s+/);
  for (const cls of classes.split(".").filter(Boolean)) if (!own.includes(cls)) return false;
  for (const [, k, v] of attrs.matchAll(/\[([\w-]+)="([^"]*)"\]/g)) if (el.getAttribute(k) !== v) return false;
  return true;
}

let focused = null;

// The form's structure mirrors public/index.html for the parts main.js touches.
function buildPage() {
  const h = (tag, attrs, ...children) => new El(tag, attrs, children);
  const statusBox = h("div", { id: "form-status", class: "form-status", role: "alert", hidden: "" });
  const button = h("button", { type: "submit", class: "btn btn-primary" });
  button.textContent = "Send";
  const form = h(
    "form",
    { id: "donate-form" },
    h("div", { class: "field" }, h("label", {}), h("input", { type: "email", name: "email" })),
    h(
      "fieldset",
      { class: "field" },
      h("div", { class: "checkbox-grid" }, h("label", { class: "checkbox-item" }, h("input", { type: "checkbox", name: "categories[]" }))),
    ),
    h("div", { class: "cf-turnstile" }),
    h("div", { class: "form-submit" }, statusBox, button),
  );
  return { form, statusBox, button };
}

async function run(fetchImpl) {
  const page = buildPage();
  focused = null;
  const resets = [];
  const window = { location: { href: "/" }, turnstile: { reset: (w) => resets.push(w) } };
  const document = {
    getElementById: (id) => (id === "donate-form" ? page.form : id === "form-status" ? page.statusBox : null),
    createElement: (tag) => new El(tag),
  };
  let resolveFetch;
  const fetched = new Promise((r) => (resolveFetch = r));
  const context = {
    document,
    window,
    FormData: class {},
    fetch: (...args) => {
      resolveFetch(args);
      return fetchImpl(...args);
    },
  };
  context.window.addEventListener = () => {};
  context.addEventListener = context.window.addEventListener;
  vm.runInNewContext(source, context);
  page.form.listeners.submit({ preventDefault() {} });
  const sendingState = { label: page.button.textContent, disabled: page.button.disabled, busy: page.form.getAttribute("aria-busy") };
  const [url, init] = await fetched;
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  return { ...page, window, resets, sendingState, url, init, focused };
}

const json = (status, body) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const failures = [];
const expect = (label, ok) => {
  if (!ok) failures.push(label);
};

{
  const r = await run(() => json(200, { ok: true }));
  expect("posts to /api/submit asking for JSON", r.url === "/api/submit" && r.init.method === "POST" && r.init.headers.Accept === "application/json");
  expect("shows Sending… while in flight", r.sendingState.label === "Sending…" && r.sendingState.disabled && r.sendingState.busy === "true");
  expect("redirects to /thanks on success", r.window.location.href === "/thanks");
}

{
  const r = await run(() =>
    json(400, { ok: false, errors: { email: "That doesn't look like a valid email.", categories: "Please choose at least one category.", turnstile: "We couldn't verify you're human." } }),
  );
  const email = r.form.querySelector('[name="email"]');
  const errors = r.form.querySelectorAll(".field-error").map((e) => e.textContent);
  expect("restores the button after an error", r.button.textContent === "Send" && !r.button.disabled && r.form.getAttribute("aria-busy") === null);
  expect("marks the invalid field", email.getAttribute("aria-invalid") === "true" && email.getAttribute("aria-describedby") === "error-email");
  expect("shows each field error", errors.length === 3 && errors.includes("That doesn't look like a valid email."));
  expect("puts the category error inside its fieldset", r.form.querySelector("fieldset").querySelector(".field-error") !== null);
  expect("resets Turnstile for a retry", r.resets.length === 1);
  expect("moves focus to the first invalid field", r.focused === email);
  expect("does not redirect", r.window.location.href === "/");
}

{
  const r = await run(() => json(429, { ok: false, errors: { form: "Too many submissions. Please try again in a minute." } }));
  expect("shows a form-level error in the status box", !r.statusBox.hidden && r.statusBox.textContent.startsWith("Too many submissions"));
  expect("focuses the status box", r.focused === r.statusBox);
}

{
  const r = await run(() => Promise.reject(new TypeError("Failed to fetch")));
  expect("shows a generic message when the request fails", !r.statusBox.hidden && /went wrong/.test(r.statusBox.textContent));
  expect("re-enables the button when the request fails", !r.button.disabled && r.button.textContent === "Send");
}

if (failures.length > 0) {
  console.error("Form check failed:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("Form check passed (donate form: sending, errors, redirect).");

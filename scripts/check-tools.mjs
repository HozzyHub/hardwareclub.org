// Runs public/tools.js against a minimal fake DOM built from the generated
// tool pages, so a field renamed in scripts/resources/ but not in tools.js
// (or the reverse) is caught. No browser or DOM library needed.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = await readFile(path.join(root, "public", "tools.js"), "utf8");

/** Reads the form's controls (name, type, option values) out of the page HTML. */
async function formFields(page, formId) {
  const html = await readFile(path.join(root, "public", "resources", `${page}.html`), "utf8");
  const start = html.indexOf(`<form id="${formId}"`);
  if (start < 0) throw new Error(`${page}: no form #${formId}`);
  const formHtml = html.slice(start, html.indexOf("</form>", start));
  const fields = [];
  for (const m of formHtml.matchAll(/<select[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const options = [...m[2].matchAll(/<option value="([^"]*)"/g)].map((o) => o[1]);
    fields.push({ name: m[1], type: "select-one", value: options[0], checked: false, options });
  }
  for (const m of formHtml.matchAll(/<input type="checkbox"[^>]*name="([^"]+)"/g)) {
    fields.push({ name: m[1], type: "checkbox", value: "on", checked: false });
  }
  return fields;
}

function fakeNode(tag) {
  return {
    tag,
    children: [],
    textContent: "",
    hidden: true,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
  };
}

function text(node) {
  return (typeof node === "string" ? node : node.textContent) + (node.children ?? []).map(text).join(" ");
}

/** Loads tools.js with one tool's form wired up; returns a function that sets fields and reads the result. */
function load(formId, boxId, fields) {
  const listeners = {};
  const form = {
    elements: fields,
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
  };
  const box = fakeNode("div");
  Object.defineProperty(box, "textContent", {
    get: () => "",
    set: () => {
      box.children = [];
    },
  });
  const document = {
    getElementById: (id) => (id === formId ? form : id === boxId ? box : null),
    createElement: fakeNode,
    createTextNode: (t) => t,
  };
  vm.runInNewContext(source, { document });
  return (values) => {
    for (const field of fields) {
      if (field.name in values) {
        if (field.type === "checkbox") field.checked = values[field.name];
        else field.value = values[field.name];
      }
    }
    listeners.change();
    if (box.hidden) throw new Error(`#${boxId} stayed hidden`);
    return text(box);
  };
}

const failures = [];
function expectContains(label, actual, expected) {
  if (!actual.includes(expected)) failures.push(`${label}: expected result to contain "${expected}"`);
}

const wipeFields = await formFields("wipe-method-picker", "wipe-form");
const wipe = load("wipe-form", "wipe-result", wipeFields);
for (const device of wipeFields.find((f) => f.name === "wdevice").options) {
  for (const drive of wipeFields.find((f) => f.name === "wdrive").options) {
    const result = wipe({ wdevice: device, wdrive: drive, wbroken: false });
    expectContains(`wipe ${device}/${drive}`, result, "steps");
  }
}
expectContains("wipe broken", wipe({ wdevice: "windows", wbroken: true }), "Remove and keep the drive");

const triageFields = await formFields("donate-or-recycle", "triage-form");
const triage = load("triage-form", "triage-result", triageFields);
for (const device of triageFields.find((f) => f.name === "device").options) {
  for (const power of triageFields.find((f) => f.name === "power").options) {
    triage({ device, power, swollen: false });
  }
}
expectContains("triage swollen", triage({ swollen: true }), "handle the battery first");

if (failures.length > 0) {
  console.error("Tool check failed:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("Tool check passed (wipe picker, donate-or-recycle).");

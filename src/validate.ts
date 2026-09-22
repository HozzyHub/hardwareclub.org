import type { RawSubmission } from "./body";

export const CATEGORY_VALUES = [
  "laptops",
  "desktops",
  "servers",
  "phones-tablets",
  "networking",
  "components",
  "peripherals-cables",
  "other",
] as const;
export type Category = (typeof CATEGORY_VALUES)[number];

export const QUANTITY_VALUES = ["1", "2-5", "6-20", "20+"] as const;
export type Quantity = (typeof QUANTITY_VALUES)[number];

export const POWERS_ON_VALUES = ["yes", "no", "mixed", "not-sure"] as const;
export type PowersOn = (typeof POWERS_ON_VALUES)[number];

export const HANDOFF_VALUES = ["drop-off", "figure-it-out"] as const;
export type Handoff = (typeof HANDOFF_VALUES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CATEGORIES = 8;

export interface NormalizedSubmission {
  name: string;
  email: string;
  phone: string | null;
  location: string;
  categories: Category[];
  description: string;
  quantity: Quantity;
  powers_on: PowersOn;
  handoff: Handoff;
  drive_back: boolean;
  consent: boolean;
}

export type ValidationErrors = Record<string, string>;

export type ValidationResult =
  | { ok: true; data: NormalizedSubmission }
  | { ok: false; errors: ValidationErrors };

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

export function validateSubmission(input: RawSubmission): ValidationResult {
  const errors: ValidationErrors = {};

  const name = input.name.trim().slice(0, 120);
  if (!name) errors.name = "Please enter your name.";

  const email = input.email.trim().slice(0, 200);
  if (!email) {
    errors.email = "Please enter your email.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "That doesn't look like a valid email.";
  }

  const phoneTrimmed = input.phone.trim().slice(0, 40);
  const phone = phoneTrimmed || null;

  const location = input.location.trim().slice(0, 120);
  if (!location) errors.location = "Please enter a city or ZIP.";

  let categories: Category[] = [];
  if (input.categories.length > MAX_CATEGORIES) {
    errors.categories = "Please choose 8 categories or fewer.";
  } else {
    const invalid = input.categories.some((c) => !isOneOf(CATEGORY_VALUES, c));
    if (invalid) {
      errors.categories = "One of the selected categories isn't recognized.";
    } else {
      categories = Array.from(new Set(input.categories)) as Category[];
      if (categories.length === 0) {
        errors.categories = "Please choose at least one category.";
      }
    }
  }

  const description = input.description.trim().slice(0, 2000);
  if (!description) errors.description = "Please tell us a bit about what you have.";

  const quantity = input.quantity.trim();
  if (!isOneOf(QUANTITY_VALUES, quantity)) {
    errors.quantity = "Please choose roughly how many items you have.";
  }

  const powersOn = input.powers_on.trim();
  if (!isOneOf(POWERS_ON_VALUES, powersOn)) {
    errors.powers_on = "Please let us know if it powers on.";
  }

  const handoff = input.handoff.trim();
  if (!isOneOf(HANDOFF_VALUES, handoff)) {
    errors.handoff = "Please choose a handoff option.";
  }

  if (!input.consent) {
    errors.consent = "Please confirm you understand Hardware Club isn't a nonprofit.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      location,
      categories,
      description,
      quantity: quantity as Quantity,
      powers_on: powersOn as PowersOn,
      handoff: handoff as Handoff,
      drive_back: input.drive_back,
      consent: input.consent,
    },
  };
}

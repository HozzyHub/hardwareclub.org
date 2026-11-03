// Every module that contributes templated pages or files. Each module exports
// `pages` (see scripts/build-pages.mjs render()) and optionally `files`.
// Page fields: url, crumb, title, description, eyebrow, h1, lede, body,
// and optional script, jsonld, head, ogType, mainClass, sitemap (false to omit).
import * as resources from "../resources/content.mjs";
import * as blog from "./blog.mjs";
import * as securityHub from "./security.mjs";
import * as exploited from "./exploited.mjs";
import * as deviceSupport from "./device-support.mjs";

export const modules = [resources, blog, securityHub, exploited, deviceSupport];

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.resolve(scriptDirectory, "..", "dist");
const SITE_URL = "https://jamula.net";
const ALLOWED_HOSTS = new Set(["jamula.net", "www.jamula.net", "jamula.com", "www.jamula.com"]);

function parseAttributes(source) {
  const attributes = {};
  const expression = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(expression)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function parsePage(html) {
  const tags = [];
  const anchors = [];
  const ids = [];
  const canonicals = [];
  const descriptions = [];
  const ogUrls = [];
  const stylesheets = [];
  const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(
    (match) => match[1]
  );
  const jsonLd = [];
  const resources = [];
  const titleMatches = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  const title = titleMatches.map((match) => match[1].replace(/<[^>]*>/g, "").trim());

  for (const match of html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)) {
    const tag = match[1].toLowerCase();
    const attributes = parseAttributes(match[2]);
    tags.push([tag, attributes]);
    if (attributes.id) ids.push(attributes.id);
    if (tag === "a") anchors.push(attributes.href ?? "");

    if (tag === "meta") {
      if (attributes.name?.toLowerCase() === "description") {
        descriptions.push(attributes.content ?? "");
      }
      if (attributes.property?.toLowerCase() === "og:url") {
        ogUrls.push(attributes.content ?? "");
      }
    }

    if (tag === "link") {
      const rel = new Set((attributes.rel ?? "").toLowerCase().split(/\s+/));
      if (rel.has("canonical")) canonicals.push(attributes.href ?? "");
      if (rel.has("stylesheet")) stylesheets.push(attributes.href ?? "");
      if (["stylesheet", "preload", "modulepreload", "icon"].some((item) => rel.has(item))) {
        resources.push(attributes.href ?? "");
      }
    }

    if (["script", "img", "iframe", "video", "audio", "source"].includes(tag)) {
      if (attributes.src) resources.push(attributes.src);
      if (tag === "script" && attributes.type?.toLowerCase() === "application/ld+json") {
        const script = html.slice(match.index + match[0].length);
        jsonLd.push(script.match(/^[\s\S]*?<\/script>/i)?.[0].replace(/<\/script>$/i, "") ?? "");
      }
    }
  }

  const headingLevels = tags
    .map(([tag]) => (/^h[1-6]$/.test(tag) ? Number(tag[1]) : null))
    .filter((level) => level !== null);
  return {
    title,
    tags,
    anchors,
    ids,
    canonicals,
    descriptions,
    ogUrls,
    stylesheets,
    inlineStyles,
    jsonLd,
    resources,
    headingLevels,
  };
}

function normalizeRoute(route) {
  return route.replace(/\/+$/, "") || "/";
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function localFile(root, currentFile, urlPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  let candidate = path.resolve(
    decodedPath.startsWith("/")
      ? path.join(root, decodedPath.replace(/^\/+/, ""))
      : path.resolve(path.dirname(currentFile), decodedPath)
  );
  if (!isWithin(root, candidate)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, "index.html");
  }
  if (!fs.existsSync(candidate) && !path.extname(candidate)) {
    const routeFile = `${candidate}.html`;
    if (fs.existsSync(routeFile)) candidate = routeFile;
  }
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : null;
}

function luminance(color) {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) throw new Error(`unsupported color value ${JSON.stringify(color)}`);
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join("") : match[1];
  const channels = [0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function declarations(css) {
  return Object.fromEntries(
    [...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)\s*(?:;|$)/g)].map((match) => [
      match[1],
      match[2].trim(),
    ])
  );
}

function darkRootBlock(css) {
  const media = /@media\s*\(prefers-color-scheme\s*:\s*dark\)\s*\{/i.exec(css);
  if (!media) return null;
  const root = /:root\s*\{/i.exec(css.slice(media.index + media[0].length));
  if (!root) return null;
  const opening = media.index + media[0].length + root.index + root[0].length - 1;
  let depth = 1;
  for (let index = opening + 1; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) {
      return {
        declarations: css.slice(opening + 1, index),
        mediaStart: media.index,
      };
    }
  }
  return null;
}

function resolveColor(token, variables) {
  const value = variables[token];
  if (!value) throw new Error(`missing color token ${token}`);
  const reference = value.match(/^var\((--[\w-]+)\)$/);
  if (reference) return resolveColor(reference[1], variables);
  if (!/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value)) {
    throw new Error(`${token} does not resolve to a hex color`);
  }
  return value;
}

function contrastErrors(styles) {
  const css = styles.join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const dark = darkRootBlock(css);
  if (!dark) return ["color tokens are missing a prefers-color-scheme: dark root"];
  const lightVariables = declarations(css.slice(0, dark.mediaStart));
  const darkVariables = { ...lightVariables, ...declarations(dark.declarations) };
  const pairs = [
    ["--j-color-text", "--j-color-bg", 4.5],
    ["--j-color-text", "--j-color-surface", 4.5],
    ["--j-color-text-subtle", "--j-color-bg", 4.5],
    ["--j-color-text-subtle", "--j-color-surface", 4.5],
    ["--j-color-accent", "--j-color-bg", 4.5],
    ["--j-color-accent", "--j-color-surface", 4.5],
    ["--j-color-accent-hover", "--j-color-bg", 4.5],
    ["--j-color-accent-hover", "--j-color-surface", 4.5],
    ["--j-color-skip-link-fg", "--j-color-skip-link-bg", 4.5],
    ["--j-color-focus-ring", "--j-color-bg", 3],
  ];
  const errors = [];
  for (const [theme, variables] of [
    ["light", lightVariables],
    ["dark", darkVariables],
  ]) {
    for (const [foreground, background, minimum] of pairs) {
      try {
        const ratio = contrastRatio(
          resolveColor(foreground, variables),
          resolveColor(background, variables)
        );
        if (ratio < minimum) {
          errors.push(
            `${theme} contrast ${foreground} on ${background} is ${ratio.toFixed(2)}:1, ` +
              `below ${minimum.toFixed(1)}:1`
          );
        }
      } catch (error) {
        errors.push(`${theme} contrast: ${error.message}`);
      }
    }
  }
  return errors;
}

function validateOrganizationSchema(page, prefix) {
  if (page.jsonLd.length !== 1) {
    return [`${prefix}homepage must contain exactly one JSON-LD block`];
  }
  let schema;
  try {
    schema = JSON.parse(page.jsonLd[0]);
  } catch {
    return [`${prefix}Organization JSON-LD is invalid`];
  }
  if (!schema || Array.isArray(schema) || typeof schema !== "object") {
    return [`${prefix}Organization JSON-LD must be an object`];
  }

  const expected = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://jamula.net/#organization",
    name: "Jamula",
    url: "https://jamula.net/",
    logo: "https://jamula.net/apple-touch-icon.png",
  };
  const errors = [];
  for (const [property, value] of Object.entries(expected)) {
    if (schema[property] !== value) {
      errors.push(`${prefix}Organization JSON-LD has an incorrect ${property} property`);
    }
  }
  const extraProperties = Object.keys(schema).filter((property) => !(property in expected));
  if (extraProperties.length) {
    errors.push(
      `${prefix}Organization JSON-LD has unsupported properties: ${extraProperties.sort().join(", ")}`
    );
  }
  return errors;
}

function validateSitemaps(root, canonicalRoutes) {
  const errors = [];
  const robotsPath = path.join(root, "robots.txt");
  const indexPath = path.join(root, "sitemap-index.xml");
  if (!fs.existsSync(robotsPath)) {
    errors.push("robots.txt is missing from the built site");
  } else {
    const lines = fs.readFileSync(robotsPath, "utf8").split(/\r?\n/);
    const sitemapLines = lines
      .filter((line) => line.toLowerCase().startsWith("sitemap:"))
      .map((line) => line.split(":").slice(1).join(":").trim());
    if (!lines.includes("User-agent: *") || !lines.includes("Allow: /")) {
      errors.push("robots.txt must allow public crawling for all user agents");
    }
    if (JSON.stringify(sitemapLines) !== JSON.stringify([`${SITE_URL}/sitemap-index.xml`])) {
      errors.push("robots.txt must reference the Jamula.net sitemap index exactly once");
    }
  }
  if (!fs.existsSync(indexPath)) {
    return [...errors, "sitemap-index.xml is missing from the built site"];
  }

  const indexXml = fs.readFileSync(indexPath, "utf8");
  if (
    !/<sitemapindex\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i.test(
      indexXml
    ) ||
    !/<\/sitemapindex>/i.test(indexXml)
  ) {
    return [...errors, "sitemap-index.xml must contain a sitemapindex root"];
  }
  const entries = [
    ...indexXml.matchAll(/<sitemap\b[^>]*>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi),
  ];
  if (entries.length === 0) errors.push("sitemap index does not reference any sitemap files");

  const sitemapUrls = [];
  for (const entry of entries) {
    const sitemapUrl = entry[1].replace(/&amp;/g, "&").trim();
    let parsed;
    try {
      parsed = new URL(sitemapUrl);
    } catch {
      errors.push(`sitemap index contains an invalid sitemap URL: ${sitemapUrl}`);
      continue;
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "jamula.net" ||
      parsed.search ||
      parsed.hash
    ) {
      errors.push(`sitemap index contains a non-canonical sitemap URL: ${sitemapUrl}`);
      continue;
    }
    const sitemapFile = localFile(root, indexPath, parsed.pathname);
    if (!sitemapFile) {
      errors.push(`sitemap index references a missing built file: ${sitemapUrl}`);
      continue;
    }
    const xml = fs.readFileSync(sitemapFile, "utf8");
    if (
      !/<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i.test(
        xml
      ) ||
      !/<\/urlset>/i.test(xml)
    ) {
      errors.push(`${path.basename(sitemapFile)} must contain a urlset root`);
      continue;
    }
    const locations = [
      ...xml.matchAll(/<url\b[^>]*>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/url>/gi),
    ];
    sitemapUrls.push(...locations.map((location) => location[1].replace(/&amp;/g, "&").trim()));
  }

  if (new Set(sitemapUrls).size !== sitemapUrls.length) {
    errors.push("sitemap contains duplicate page URLs");
  }
  const expectedUrls = new Set(Object.values(canonicalRoutes).map((route) => route.url));
  const observedUrls = new Set();
  for (const sitemapUrl of sitemapUrls) {
    let parsed;
    try {
      parsed = new URL(sitemapUrl);
    } catch {
      errors.push(`sitemap contains an invalid page URL: ${sitemapUrl}`);
      continue;
    }
    if (parsed.protocol !== "https:" || parsed.hostname !== "jamula.net") {
      errors.push(`sitemap contains a non-canonical page URL: ${sitemapUrl}`);
      continue;
    }
    if (!canonicalRoutes[normalizeRoute(parsed.pathname)]) {
      errors.push(`sitemap URL has no generated page route: ${sitemapUrl}`);
    }
    observedUrls.add(sitemapUrl);
  }
  if (
    expectedUrls.size !== observedUrls.size ||
    [...expectedUrls].some((url) => !observedUrls.has(url))
  ) {
    errors.push("sitemap page URLs must exactly match generated canonical HTML routes");
  }
  return errors;
}

function validateSite(siteDirectory) {
  const root = path.resolve(siteDirectory);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return [`built site directory does not exist: ${root}`];
  }
  const htmlFiles = [];
  function collectHtml(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) collectHtml(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(fullPath);
    }
  }
  collectHtml(root);
  if (htmlFiles.length === 0) return ["built site contains no HTML routes"];

  const pages = new Map(htmlFiles.map((file) => [file, parsePage(fs.readFileSync(file, "utf8"))]));
  const canonicalRoutes = {};
  const stylesheetPaths = new Set();
  const styles = [];
  const errors = [];

  for (const [file, page] of pages) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    const prefix = `${relative}: `;
    if (page.title.length !== 1 || !page.title[0]) {
      errors.push(`${prefix}expected one non-empty document title`);
    }
    if (page.descriptions.length !== 1 || !page.descriptions[0].trim()) {
      errors.push(`${prefix}expected one non-empty meta description`);
    }
    if (page.canonicals.length !== 1) {
      errors.push(`${prefix}expected exactly one canonical link`);
    } else {
      let canonical;
      try {
        canonical = new URL(page.canonicals[0]);
      } catch {
        canonical = null;
      }
      if (
        !canonical ||
        canonical.protocol !== "https:" ||
        canonical.hostname !== "jamula.net" ||
        canonical.search ||
        canonical.hash
      ) {
        errors.push(`${prefix}canonical must be an absolute Jamula.net HTTPS URL`);
      } else {
        const route = normalizeRoute(canonical.pathname);
        if (path.basename(file) !== "404.html") {
          if (canonicalRoutes[route]) {
            errors.push(`${prefix}canonical route duplicates ${canonicalRoutes[route].file}`);
          }
          canonicalRoutes[route] = { file, url: canonical.href };
        }
      }
      if (page.ogUrls.length !== 1 || page.ogUrls[0] !== page.canonicals[0]) {
        errors.push(`${prefix}Open Graph URL must match the canonical URL`);
      }
    }

    const htmlTags = page.tags.filter(([tag]) => tag === "html");
    if (htmlTags.length !== 1 || !htmlTags[0][1].lang?.trim()) {
      errors.push(`${prefix}html element must declare a non-empty language`);
    }
    for (const landmark of ["header", "nav", "main", "footer"]) {
      if (page.tags.filter(([tag]) => tag === landmark).length !== 1) {
        errors.push(`${prefix}expected exactly one ${landmark} landmark`);
      }
    }
    if (page.headingLevels.filter((level) => level === 1).length !== 1) {
      errors.push(`${prefix}expected exactly one h1 heading`);
    }
    if (page.headingLevels[0] !== 1) {
      errors.push(`${prefix}first heading must be h1`);
    }
    for (let index = 1; index < page.headingLevels.length; index += 1) {
      if (page.headingLevels[index] > page.headingLevels[index - 1] + 1) {
        errors.push(
          `${prefix}heading level jumps from h${page.headingLevels[index - 1]} ` +
            `to h${page.headingLevels[index]}`
        );
        break;
      }
    }
    const mains = page.tags.filter(([tag]) => tag === "main");
    if (
      mains.length === 1 &&
      (mains[0][1].id !== "main-content" || mains[0][1].tabindex !== "-1")
    ) {
      errors.push(`${prefix}main landmark must have id=main-content and tabindex=-1`);
    }
    if (page.anchors[0] !== "#main-content" || !page.ids.includes("main-content")) {
      errors.push(`${prefix}first link must target the existing main-content skip target`);
    }
    if (new Set(page.ids).size !== page.ids.length) {
      errors.push(`${prefix}duplicate id attributes are present`);
    }
    if (path.basename(file) === "index.html") {
      errors.push(...validateOrganizationSchema(page, prefix));
    }

    for (const href of page.stylesheets) {
      const target = localFile(root, file, href);
      if (!target) errors.push(`${prefix}stylesheet does not resolve to a built file: ${href}`);
      else stylesheetPaths.add(target);
    }
    styles.push(...page.inlineStyles);

    for (const resource of page.resources) {
      let parsed;
      try {
        parsed = new URL(resource, SITE_URL);
      } catch {
        errors.push(`${prefix}invalid network resource URL: ${resource}`);
        continue;
      }
      if (parsed.protocol === "data:") continue;
      if (parsed.hostname && !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
        errors.push(`${prefix}third-party network resource is not allowed: ${resource}`);
        continue;
      }
      if (parsed.protocol !== "https:" && parsed.origin !== SITE_URL) {
        errors.push(`${prefix}network resource must use HTTPS: ${resource}`);
        continue;
      }
      if (parsed.hostname === "jamula.net" && parsed.pathname.startsWith("/")) {
        const target = localFile(root, file, parsed.pathname);
        if (!target) errors.push(`${prefix}resource does not resolve to a built file: ${resource}`);
      } else if (!parsed.hostname) {
        const target = localFile(root, file, parsed.pathname);
        if (!target) errors.push(`${prefix}resource does not resolve to a built file: ${resource}`);
      }
    }
  }

  for (const stylesheet of stylesheetPaths) {
    styles.push(fs.readFileSync(stylesheet, "utf8"));
  }
  errors.push(...contrastErrors(styles));

  for (const [file, page] of pages) {
    const canonical = page.canonicals.length === 1 ? page.canonicals[0] : `${SITE_URL}/`;
    for (const href of page.anchors) {
      if (!href) continue;
      let targetUrl;
      try {
        targetUrl = new URL(href, canonical);
      } catch {
        errors.push(`${path.basename(file)}: invalid internal link URL: ${href}`);
        continue;
      }
      if (targetUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(targetUrl.hostname.toLowerCase())) {
        continue;
      }
      const route = normalizeRoute(targetUrl.pathname || new URL(canonical).pathname);
      const routePage = canonicalRoutes[route];
      const target = routePage?.file ?? localFile(root, file, targetUrl.pathname);
      if (!target) {
        errors.push(
          `${path.relative(root, file).split(path.sep).join("/")}: ` +
            `internal link has no built target: ${href}`
        );
        continue;
      }
      if (targetUrl.hash && target.endsWith(".html")) {
        const targetPage = pages.get(target) ?? parsePage(fs.readFileSync(target, "utf8"));
        let fragment;
        try {
          fragment = decodeURIComponent(targetUrl.hash.slice(1));
        } catch {
          fragment = targetUrl.hash.slice(1);
        }
        if (!targetPage.ids.includes(fragment)) {
          errors.push(
            `${path.relative(root, file).split(path.sep).join("/")}: ` +
              `internal fragment does not exist: ${href}`
          );
        }
      }
    }
  }
  errors.push(...validateSitemaps(root, canonicalRoutes));
  return errors;
}

function copyBuild(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "jamula-site-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const destination = path.join(temporary, "dist");
  fs.cpSync(BUILD_DIR, destination, { recursive: true });
  return destination;
}

function builtPage(root = BUILD_DIR) {
  return path.join(root, "index.html");
}

function baseStylesheet(root) {
  const directory = path.join(root, "_astro");
  return fs
    .readdirSync(directory)
    .map((file) => path.join(directory, file))
    .find((file) => file.endsWith(".css") && fs.readFileSync(file, "utf8").includes("--j-ink"));
}

test("built output satisfies SEO, accessibility, privacy, and schema contracts", () => {
  assert.deepEqual(validateSite(BUILD_DIR), []);
});

test("metadata checks reject an empty title, missing description, and wrong canonical", (t) => {
  const root = copyBuild(t);
  const file = builtPage(root);
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<title>[\s\S]*?<\/title>/i, "<title></title>");
  html = html.replace(/<meta name="description"[^>]*>/i, "");
  html = html.replace(
    '<link rel="canonical" href="https://jamula.net/">',
    '<link rel="canonical" href="http://jamula.com/">'
  );
  fs.writeFileSync(file, html);

  const messages = validateSite(root).join("\n");
  assert.match(messages, /non-empty document title/);
  assert.match(messages, /meta description/);
  assert.match(messages, /canonical must be an absolute Jamula\.net HTTPS URL/);
});

test("semantic checks reject a broken skip target and missing h1", (t) => {
  const root = copyBuild(t);
  const file = builtPage(root);
  let html = fs.readFileSync(file, "utf8");
  html = html.replace('href="#main-content"', 'href="#missing-main"');
  html = html.replace("<h1 ", "<h2 ").replace("</h1>", "</h2>");
  fs.writeFileSync(file, html);

  const messages = validateSite(root).join("\n");
  assert.match(messages, /exactly one h1 heading/);
  assert.match(messages, /first link must target the existing main-content skip target/);
});

test("internal link validation rejects a missing fragment target", (t) => {
  const root = copyBuild(t);
  const file = builtPage(root);
  fs.writeFileSync(
    file,
    fs.readFileSync(file, "utf8").replace('href="#synthesis"', 'href="#missing-section"')
  );

  assert.match(validateSite(root).join("\n"), /internal fragment does not exist/);
});

test("sitemap validation rejects a noncanonical and unknown route", (t) => {
  const root = copyBuild(t);
  const sitemap = path.join(root, "sitemap-0.xml");
  fs.writeFileSync(
    sitemap,
    fs.readFileSync(sitemap, "utf8").replace("https://jamula.net/", "https://jamula.com/missing/")
  );

  const messages = validateSite(root).join("\n");
  assert.match(messages, /sitemap contains a non-canonical page URL/);
  assert.match(messages, /sitemap page URLs must exactly match/);
});

test("contrast validation detects light and dark token regressions", (t) => {
  const root = copyBuild(t);
  const stylesheet = baseStylesheet(root);
  assert.ok(stylesheet, "the built base stylesheet must contain the Jamula color tokens");
  let css = fs.readFileSync(stylesheet, "utf8");
  css = css.replace("--j-ink:#1b1a16", "--j-ink:#e9e7df");
  css = css.replace("--j-press:#63bd8d", "--j-press:#17160f");
  fs.writeFileSync(stylesheet, css);

  const messages = validateSite(root).join("\n");
  assert.match(messages, /light contrast --j-color-text on --j-color-bg/);
  assert.match(messages, /dark contrast --j-color-accent on --j-color-bg/);
});

test("Organization schema validation rejects invalid JSON, wrong identity, and extra fields", async (t) => {
  const mutations = [
    {
      name: "invalid JSON",
      update: (value) => value.replace('"@context"', "broken"),
      diagnostic: /Organization JSON-LD is invalid/,
    },
    {
      name: "wrong canonical",
      update: (value) =>
        value.replace('"url":"https://jamula.net/"', '"url":"https://jamula.com/"'),
      diagnostic: /incorrect url property/,
    },
    {
      name: "extra field",
      update: (value) =>
        value.replace(
          '"logo":"https://jamula.net/apple-touch-icon.png"',
          '"logo":"https://jamula.net/apple-touch-icon.png","sameAs":"https://example.invalid"'
        ),
      diagnostic: /unsupported properties: sameAs/,
    },
  ];

  for (const mutation of mutations) {
    await t.test(mutation.name, (subtest) => {
      const root = copyBuild(subtest);
      const file = builtPage(root);
      let html = fs.readFileSync(file, "utf8");
      const script = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/i;
      const match = html.match(script);
      assert.ok(match, "the baseline homepage must have one JSON-LD block");
      html = html.replace(script, `${match[1]}${mutation.update(match[2])}${match[3]}`);
      fs.writeFileSync(file, html);

      assert.match(validateSite(root).join("\n"), mutation.diagnostic);
    });
  }
});

test("external third-party resources are rejected", (t) => {
  const root = copyBuild(t);
  const file = builtPage(root);
  fs.writeFileSync(
    file,
    fs
      .readFileSync(file, "utf8")
      .replace("</body>", '<script src="https://tracker.example/collect.js"></script></body>')
  );

  assert.match(validateSite(root).join("\n"), /third-party network resource/);
});

if (!fs.existsSync(BUILD_DIR)) {
  throw new Error(`Build the Astro site before running tests: ${BUILD_DIR}`);
}

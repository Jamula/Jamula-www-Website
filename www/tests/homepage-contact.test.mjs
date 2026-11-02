import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

test("homepage publishes only the approved contact link and exact label", () => {
  const links = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)];
  const contactLinks = links.filter(([, attributes]) =>
    /\bhref=["'](?:mailto:|tel:)/i.test(attributes)
  );
  assert.equal(contactLinks.length, 1);
  const [, attributes, label] = contactLinks[0];
  assert.match(attributes, /\bhref="mailto:spam@jamula\.net"/);
  assert.equal(label, "Contact Jamula, Inc.");
  assert.doesNotMatch(attributes, /\b(?:aria-label|aria-hidden|tabindex|target)=/);
  assert.doesNotMatch(html, /<form\b/i);
});

test("homepage provides a visible copyable address when no mail app opens", () => {
  assert.match(
    html,
    /If the email link does not open your mail app, copy this address:\s+<span\b[^>]*class="next__email"[^>]*>spam@jamula\.net<\/span>/
  );
  assert.doesNotMatch(
    html.match(/<span\b[^>]*class="next__email"[^>]*>/)?.[0] ?? "",
    /\b(?:hidden|aria-hidden|style)=/
  );
});

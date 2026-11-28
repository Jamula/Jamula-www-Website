import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const distUrl = (relativePath) => new URL(`../dist/${relativePath}`, import.meta.url);

test("static /llms.txt and /llms-full.txt expose canonical pages and published tech notes", async () => {
  const llms = await readFile(distUrl("llms.txt"), "utf8");
  const llmsFull = await readFile(distUrl("llms-full.txt"), "utf8");

  assert.match(llms, /^# Jamula\n/m);
  assert.ok(
    llms.includes("\n- [Technical notes](https://jamula.net/tech/): "),
    "llms.txt must link the canonical /tech/ index"
  );
  assert.ok(
    llms.includes(
      "\n- [Evidence-gated static delivery and zero-inference-cost MCP](https://jamula.net/tech/evidence-gated-static-delivery/): "
    ),
    "llms.txt must link the published technical note"
  );
  assert.ok(
    llms.includes("\n- [Full text index](https://jamula.net/llms-full.txt): "),
    "llms.txt must link /llms-full.txt"
  );

  assert.match(llmsFull, /^# Jamula — Full Public Reference\n/m);
  assert.ok(
    llmsFull.includes("\nURL: https://jamula.net/tech/evidence-gated-static-delivery/\n"),
    "llms-full.txt must include the exact canonical article URL line"
  );
  assert.match(llmsFull, /caller-brings-model/i);
  assert.doesNotMatch(llmsFull, /<script\b/i);
});

test("Astro Content Collection renders /tech/ index and article static pages", async () => {
  const contentConfig = await readFile(
    new URL("../src/content.config.ts", import.meta.url),
    "utf8"
  );
  assert.ok(
    contentConfig.includes('pattern: "*.md"'),
    "content.config.ts must restrict glob to top-level *.md files to match MCP PublicCorpus"
  );

  const techIndex = await readFile(distUrl("tech/index.html"), "utf8");
  const techArticle = await readFile(
    distUrl("tech/evidence-gated-static-delivery/index.html"),
    "utf8"
  );

  assert.match(techIndex, /<link rel="canonical" href="https:\/\/jamula\.net\/tech\/"/);
  assert.match(techIndex, /href="\/tech\/evidence-gated-static-delivery\/"/);
  assert.match(
    techArticle,
    /<link rel="canonical" href="https:\/\/jamula\.net\/tech\/evidence-gated-static-delivery\/"/
  );
  assert.match(techArticle, /Evidence-gated static delivery and zero-inference-cost MCP/);
});

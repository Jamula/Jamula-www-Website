import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const distUrl = (relativePath) => new URL(`../dist/${relativePath}`, import.meta.url);

test("static /llms.txt and /llms-full.txt expose canonical pages and published tech notes", async () => {
  const llms = await readFile(distUrl("llms.txt"), "utf8");
  const llmsFull = await readFile(distUrl("llms-full.txt"), "utf8");

  assert.match(llms, /^# Jamula\n/m);
  assert.match(llms, /https:\/\/jamula\.net\/tech\//);
  assert.match(llms, /https:\/\/jamula\.net\/tech\/evidence-gated-static-delivery\//);
  assert.match(llms, /https:\/\/jamula\.net\/llms-full\.txt/);

  assert.match(llmsFull, /^# Jamula — Full Public Reference\n/m);
  assert.match(llmsFull, /URL: https:\/\/jamula\.net\/tech\/evidence-gated-static-delivery\//);
  assert.match(llmsFull, /caller-brings-model/i);
  assert.doesNotMatch(llmsFull, /<script\b/i);
});

test("Astro Content Collection renders /tech/ index and article static pages", async () => {
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

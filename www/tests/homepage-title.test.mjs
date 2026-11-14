import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const approvedTitle = "AI Strategy, Custom Software &amp; Cloud Consulting — Jamula";

test("homepage document and social titles match the exact approved wording", () => {
  const titles = [...html.matchAll(/<title>(.*?)<\/title>/gs)];
  assert.equal(titles.length, 1);
  assert.equal(titles[0][1], approvedTitle);
  for (const selector of ['property="og:title"', 'name="twitter:title"']) {
    const tags = [...html.matchAll(/<meta\b[^>]*>/g)].filter(([tag]) => tag.includes(selector));
    assert.equal(tags.length, 1);
    assert.ok(tags[0][0].includes(`content="${approvedTitle}"`));
  }
});

test("homepage retains its canonical URL after the approved title change", () => {
  const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
  assert.equal(canonicals.length, 1);
  assert.match(canonicals[0][0], /\bhref="https:\/\/jamula\.net\/"/);
});

test("footer and analytics consent expose the selected release version", () => {
  const releaseVersion = process.env.PUBLIC_RELEASE_VERSION;
  const footerVersion = html.match(/Release v(\d+\.\d+\.\d+)/)?.[1];
  const analyticsVersion = html.match(
    /id="analytics-consent"[^>]*data-release-version="([^"]+)"/
  )?.[1];
  assert.equal(footerVersion, analyticsVersion);
  if (releaseVersion) {
    assert.equal(footerVersion, releaseVersion);
  }
  if (process.env.EXPECT_NO_RELEASE === "1") {
    assert.equal(footerVersion, undefined);
  }
});

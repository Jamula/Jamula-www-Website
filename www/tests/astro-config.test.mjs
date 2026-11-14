import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import astroConfig from "../astro.config.ts";

test("Astro config keeps the canonical static-site build settings", () => {
  assert.equal(astroConfig.site, "https://jamula.net");
  assert.equal(astroConfig.output, "static");
  assert.equal(astroConfig.build.inlineStylesheets, "auto");
  assert.equal(astroConfig.vite.build.sourcemap, false);
});

test("sitemap omits Azure auth and API routes while retaining public pages", async () => {
  const sitemap = astroConfig.integrations.find(
    (integration) => integration.name === "@astrojs/sitemap"
  );
  assert.ok(sitemap);

  const outputDirectory = await mkdtemp(path.join(tmpdir(), "jamula-sitemap-test-"));
  try {
    await sitemap.hooks["astro:config:done"]({
      config: {
        site: astroConfig.site,
        base: "/",
        trailingSlash: "always",
        build: { format: "directory" },
      },
    });
    await sitemap.hooks["astro:routes:resolved"]({ routes: [] });
    await sitemap.hooks["astro:build:done"]({
      dir: pathToFileURL(`${outputDirectory}${path.sep}`),
      pages: ["/", "/.auth/login", "/api/health", "/privacy/"].map((pathname) => ({
        pathname,
      })),
      logger: { warn() {}, error() {}, info() {} },
    });

    const sitemapXml = await readFile(path.join(outputDirectory, "sitemap-0.xml"), "utf8");
    const urls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
    assert.deepEqual(urls, ["https://jamula.net/", "https://jamula.net/privacy/"]);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

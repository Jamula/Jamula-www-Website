import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import module from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import astroConfig from "../astro.config.ts";

let mockTechCollection = [];
module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "astro:content") {
      return { url: "jamula-mock:astro-content", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "jamula-mock:astro-content") {
      return {
        format: "module",
        shortCircuit: true,
        source: [
          "export const defineCollection = (config) => config;",
          "export const getCollection = async (name) => globalThis.__jamulaGetCollection(name);",
        ].join("\n"),
      };
    }
    return nextLoad(url, context);
  },
});
globalThis.__jamulaGetCollection = (name) => {
  assert.equal(name, "tech");
  return [...mockTechCollection];
};

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

test("content.config.ts validates publishedDate and required tech note metadata", async () => {
  const { collections } = await import("../src/content.config.ts");
  assert.ok(collections.tech);
  const valid = collections.tech.schema.parse({
    title: "Architecture Note",
    description: "Short meta description",
    publishedDate: "2026-11-27",
    summary: "Executive summary",
  });
  assert.equal(valid.publishedDate, "2026-11-27");
  assert.throws(() =>
    collections.tech.schema.parse({
      title: "",
      description: "Desc",
      publishedDate: "2026/11/27",
      summary: "Summary",
    })
  );
});

test("llms.txt.ts and llms-full.txt.ts sort notes descending and handle empty note bodies", async () => {
  mockTechCollection = [
    {
      id: "older-note",
      data: {
        title: "Older Note",
        description: "Older",
        publishedDate: "2026-10-01",
        summary: "First summary.",
      },
      body: undefined,
    },
    {
      id: "newer-note",
      data: {
        title: "Newer Note",
        description: "Newer",
        publishedDate: "2026-11-27",
        summary: "Latest summary.",
      },
      body: "  Detailed technical body.  ",
    },
  ];

  const { GET: getLlms } = await import("../src/pages/llms.txt.ts");
  const { GET: getLlmsFull } = await import("../src/pages/llms-full.txt.ts");

  const llmsResponse = await getLlms({});
  assert.equal(llmsResponse.headers.get("Content-Type"), "text/plain; charset=utf-8");
  const llmsBody = await llmsResponse.text();
  assert.ok(llmsBody.indexOf("Newer Note") < llmsBody.indexOf("Older Note"));

  const fullResponse = await getLlmsFull({});
  assert.equal(fullResponse.headers.get("Content-Type"), "text/plain; charset=utf-8");
  const fullBody = await fullResponse.text();
  assert.ok(fullBody.indexOf("### Newer Note") < fullBody.indexOf("### Older Note"));
  assert.ok(fullBody.includes("Detailed technical body."));
});

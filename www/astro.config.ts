import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const SITE_URL = "https://jamula.net";

export default defineConfig({
  site: SITE_URL,
  output: "static",
  integrations: [
    sitemap({
      // Exclude any Azure Static Web Apps system paths.
      filter: (page) =>
        !page.includes("/.auth/") && !page.includes("/api/"),
    }),
  ],
  build: {
    // Inline small stylesheets to keep the HTTP waterfall shallow.
    inlineStylesheets: "auto",
  },
  vite: {
    build: {
      // Emit source maps for debugging without shipping raw source.
      sourcemap: false,
    },
  },
});

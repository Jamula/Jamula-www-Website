import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const tech = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/tech" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    summary: z.string().min(1),
  }),
});

export const collections = { tech };

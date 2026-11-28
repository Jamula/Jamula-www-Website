import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const notes = (await getCollection("tech")).sort((left, right) =>
    right.data.publishedDate.localeCompare(left.data.publishedDate)
  );

  const sections = [
    "# Jamula — Full Public Reference",
    "",
    "Source: https://jamula.net/",
    "Operator: Jamula, Inc.",
    "Founder: Cyrus Jamula",
    "Direct inquiry: spam@jamula.net",
    "",
    "## Offering",
    "",
    "Jamula works across AI strategy, custom software, and cloud consulting in a single engagement, so what we recommend is also what we build and run.",
    "",
    "### 1. AI Strategy",
    "- Evaluation of AI fit for a specific business problem",
    "- Identification of the right approach, tools, and level of investment",
    "- Honest characterization of limitations and conditions for success",
    "- A decision frame that survives scrutiny — internally and from customers",
    "",
    "### 2. Custom Software",
    "- Design and development of purpose-built applications and integrations",
    "- Architecture that separates business logic from the platforms it runs on",
    "- Delivery with clear scope, a testable definition of done, and documented handoffs",
    "- Software built to be operated, maintained, and eventually replaced — not locked in",
    "",
    "### 3. Cloud Consulting",
    "- Infrastructure design and implementation for cloud-hosted software and AI workloads",
    "- Cost, reliability, and operations planning — including the assumptions behind each tradeoff",
    "- Documentation sufficient to run, audit, and transfer the infrastructure",
    "- A path that keeps options open",
    "",
    "## Responsible AI Approach",
    "",
    "Jamula starts by checking whether incomplete data, unclear objectives, or untested assumptions are the real problem. We do not claim AI is safe by default, and we do not claim any particular AI implementation is safe until we can evaluate it against something measurable.",
    "",
    "## Technical Notes",
    "",
    ...notes.flatMap((note) => [
      `### ${note.data.title}`,
      `URL: https://jamula.net/tech/${note.id}/`,
      `Published: ${note.data.publishedDate}`,
      `Summary: ${note.data.summary}`,
      "",
      (note.body ?? "").trim(),
      "",
    ]),
  ];

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};

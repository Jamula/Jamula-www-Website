import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const notes = (await getCollection("tech")).sort((left, right) =>
    right.data.publishedDate.localeCompare(left.data.publishedDate)
  );

  const lines = [
    "# Jamula",
    "",
    "> Jamula, Inc. provides AI strategy, custom software, and cloud consulting in a single engagement.",
    "",
    "Canonical site: https://jamula.net/",
    "Direct inquiry: mailto:spam@jamula.net",
    "",
    "## Core Pages",
    "",
    "- [Home](https://jamula.net/): Integrated AI strategy, custom software, and cloud consulting overview.",
    "- [Technical notes](https://jamula.net/tech/): Architecture and engineering notes from Jamula.",
    "- [Website analytics privacy](https://jamula.net/privacy/): Optional consent-gated analytics notice and withdrawal controls.",
    "- [Full text index](https://jamula.net/llms-full.txt): Complete plain-text compilation of approved public pages and technical notes.",
    "",
    "## Technical Notes",
    "",
    ...notes.map(
      (note) => `- [${note.data.title}](https://jamula.net/tech/${note.id}/): ${note.data.summary}`
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};

import { buildBook, SAMPLE_ID } from "@/lib/reading/model";
import { propagandaChapters } from "@/lib/reading/propaganda";

export function includedBook() {
  return buildBook({
    id: SAMPLE_ID,
    title: "Propaganda",
    author: "Edward L. Bernays",
    source: "sample",
    chapters: propagandaChapters.map((chapter) => ({
      title: chapter.title,
      blocks: chapter.blocks.map((block) => ({ kind: block.kind, text: block.text })),
    })),
  });
}

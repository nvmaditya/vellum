import {
  chapterKicker,
  type Book,
  type PageSlice,
  type Sentence,
} from "@/lib/reading/model";

export type { PageSlice };

export type Page = {
  slices: PageSlice[];
  sentenceIds: string[];
};

function gapAfter(type: PageSlice["type"], fontSize: number) {
  if (type === "kicker") return fontSize * 0.55;
  if (type === "title") return fontSize * 1.15;
  if (type === "heading") return fontSize * 0.7;
  return fontSize * 0.95;
}

function sentenceIdsOf(slices: PageSlice[]) {
  return slices.flatMap((slice) => {
    if (slice.type === "title" || slice.type === "heading") return [slice.sentenceId];
    if (slice.type === "sentences") return slice.sentences.map((sentence) => sentence.id);
    return [];
  });
}

export function paginateBook(book: Book, width: number, height: number, fontSize: number, family: string): Page[] {
  if (width < 40 || height < 80) return [];
  const host = document.createElement("div");
  host.className = "page-column";
  host.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:${width}px;height:auto;overflow:visible;font-family:${family};font-size:${fontSize}px;`;
  document.body.appendChild(host);

  const measure = (node: HTMLElement) => {
    host.appendChild(node);
    const box = node.getBoundingClientRect().height;
    host.removeChild(node);
    return box;
  };

  const paragraphNode = (sentences: Sentence[]) => {
    const node = document.createElement("p");
    node.textContent = sentences.map((sentence) => sentence.text).join(" ");
    return node;
  };

  const pages: Page[] = [];
  let slices: PageSlice[] = [];
  let used = 0;

  const commit = () => {
    if (!slices.length) return;
    pages.push({ slices, sentenceIds: sentenceIdsOf(slices) });
    slices = [];
    used = 0;
  };

  const place = (node: HTMLElement, slice: PageSlice) => {
    const heightOf = measure(node);
    const gap = slices.length ? gapAfter(slices[slices.length - 1].type, fontSize) : 0;
    if (slices.length && used + gap + heightOf > height) {
      commit();
      slices.push(slice);
      used = heightOf;
      return;
    }
    slices.push(slice);
    used += gap + heightOf;
  };

  for (let index = 0; index < book.chapters.length; index += 1) {
    const chapter = book.chapters[index];
    const kicker = document.createElement("div");
    kicker.className = "kicker";
    kicker.textContent = chapterKicker(index);
    const title = document.createElement("h1");
    title.textContent = chapter.title;
    const opening = measure(kicker) + gapAfter("kicker", fontSize) + measure(title);
    if (slices.length && used + gapAfter(slices[slices.length - 1].type, fontSize) + opening > height) {
      commit();
    }
    place(kicker, { type: "kicker", chapterIndex: index });
    place(title, { type: "title", text: chapter.title, sentenceId: chapter.titleSentenceId });

    for (const block of chapter.blocks) {
      if (block.kind === "heading") {
        const sentence = block.sentences[0];
        if (!sentence) continue;
        const heading = document.createElement("h2");
        heading.textContent = block.sentences.map((item) => item.text).join(" ");
        const headingHeight = measure(heading);
        const gap = slices.length ? gapAfter(slices[slices.length - 1].type, fontSize) : 0;
        const orphan = fontSize * 1.8;
        if (slices.length && used + gap + headingHeight + orphan > height) commit();
        place(heading, {
          type: "heading",
          text: heading.textContent ?? sentence.text,
          sentenceId: sentence.id,
        });
        continue;
      }

      let remaining = block.sentences;
      while (remaining.length) {
        const gap = slices.length ? gapAfter(slices[slices.length - 1].type, fontSize) : 0;
        const space = height - used - gap;
        let fit = 0;
        if (slices.length === 0 || space > fontSize) {
          for (let count = 1; count <= remaining.length; count += 1) {
            const trial = measure(paragraphNode(remaining.slice(0, count)));
            if (trial <= (slices.length ? space : height)) fit = count;
            else break;
          }
        }
        if (fit === 0 && slices.length) {
          commit();
          continue;
        }
        if (fit === 0) fit = 1;
        const take = remaining.slice(0, fit);
        place(paragraphNode(take), { type: "sentences", sentences: take });
        remaining = remaining.slice(fit);
      }
    }
  }
  commit();
  host.remove();
  return pages;
}

export type FontId = "literata" | "newsreader" | "sans" | "atkinson";
export type ThemeId = "paper" | "sepia" | "gray" | "night";
export type VoiceId = "mara" | "jonah" | "helen";

export type Sentence = { id: string; text: string };

export type Block = {
  id: string;
  kind: "heading" | "paragraph";
  sentences: Sentence[];
};

export type Chapter = {
  id: string;
  title: string;
  titleSentenceId: string;
  blocks: Block[];
};

export type Book = {
  id: string;
  title: string;
  author: string;
  source: "sample" | "import";
  chapters: Chapter[];
};

export type PageSlice =
  | { type: "kicker"; chapterIndex: number }
  | { type: "title"; text: string; sentenceId: string }
  | { type: "heading"; text: string; sentenceId: string }
  | { type: "sentences"; sentences: Sentence[] };

export type Settings = {
  font: FontId;
  sizeIndex: number;
  theme: ThemeId;
  rate: number;
  voice: VoiceId;
};

export type Spoken = {
  id: string;
  text: string;
  role: "title" | "heading" | "sentence";
  chapterIndex: number;
  chapterTitle: string;
  lastInBlock: boolean;
};

export const SAMPLE_ID = "night-market";

export const FONT_OPTIONS: { id: FontId; label: string; family: string }[] = [
  { id: "literata", label: "Literata", family: '"Literata", Palatino, "Palatino Linotype", serif' },
  { id: "newsreader", label: "Newsreader", family: '"Newsreader", "Iowan Old Style", Palatino, serif' },
  { id: "sans", label: "Sans", family: '"Source Sans 3", "Segoe UI", sans-serif' },
  { id: "atkinson", label: "Atkinson", family: '"Atkinson Hyperlegible", "Segoe UI", sans-serif' },
];

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "paper", label: "Paper" },
  { id: "sepia", label: "Sepia" },
  { id: "gray", label: "Gray" },
  { id: "night", label: "Night" },
];

export const VOICE_OPTIONS: { id: VoiceId; label: string }[] = [
  { id: "mara", label: "Mara" },
  { id: "jonah", label: "Jonah" },
  { id: "helen", label: "Helen" },
];

export const SIZE_STEPS = [18, 20, 22, 25, 28, 32, 36];
export const RATE_STEPS = [0.85, 1, 1.15, 1.3, 1.5];

export const defaultSettings: Settings = {
  font: "literata",
  sizeIndex: 2,
  theme: "paper",
  rate: 1,
  voice: "mara",
};

const CHAPTER_WORDS = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
];

export function chapterKicker(index: number) {
  const word = CHAPTER_WORDS[index] ?? String(index + 1);
  return `Chapter ${word}`;
}

export function fontFamily(id: FontId) {
  return FONT_OPTIONS.find((font) => font.id === id)?.family ?? FONT_OPTIONS[0].family;
}

export function fontSize(index: number) {
  return SIZE_STEPS[Math.min(SIZE_STEPS.length - 1, Math.max(0, index))] ?? 22;
}

export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\u00ad/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const shielded = cleaned.replace(
    /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|vs|etc)\./gi,
    (match) => match.replace(".", "\u0000"),
  );
  const parts = shielded.split(/(?<=[.!?])\s+(?=["“‘A-Z0-9])/);
  const sentences = parts.map((part) => part.replace(/\u0000/g, ".").trim()).filter(Boolean);
  return sentences.length ? sentences : [cleaned];
}

export function buildBook(input: {
  id: string;
  title: string;
  author: string;
  source: Book["source"];
  chapters: { title: string; blocks: { kind: Block["kind"]; text: string }[] }[];
}): Book {
  let n = 0;
  const nextId = () => `${input.id}-s${n++}`;
  return {
    id: input.id,
    title: input.title,
    author: input.author,
    source: input.source,
    chapters: input.chapters.map((chapter, chapterIndex) => ({
      id: `${input.id}-c${chapterIndex}`,
      title: chapter.title,
      titleSentenceId: nextId(),
      blocks: chapter.blocks
        .map((block, blockIndex) => ({
          id: `${input.id}-c${chapterIndex}b${blockIndex}`,
          kind: block.kind,
          sentences:
            block.kind === "heading"
              ? [{ id: nextId(), text: block.text.replace(/\s+/g, " ").trim() }].filter(
                  (sentence) => sentence.text,
                )
              : splitSentences(block.text).map((text) => ({ id: nextId(), text })),
        }))
        .filter((block) => block.sentences.length > 0),
    })),
  };
}

export function spokenIn(book: Book): Spoken[] {
  const out: Spoken[] = [];
  book.chapters.forEach((chapter, chapterIndex) => {
    out.push({
      id: chapter.titleSentenceId,
      text: chapter.title,
      role: "title",
      chapterIndex,
      chapterTitle: chapter.title,
      lastInBlock: true,
    });
    for (const block of chapter.blocks) {
      block.sentences.forEach((sentence, index) => {
        out.push({
          id: sentence.id,
          text: sentence.text,
          role: block.kind === "heading" ? "heading" : "sentence",
          chapterIndex,
          chapterTitle: chapter.title,
          lastInBlock: index === block.sentences.length - 1,
        });
      });
    }
  });
  return out;
}

export function gapBetween(prev: Spoken | null, next: Spoken, rate: number) {
  if (!prev) return 0;
  let gap = 180;
  if (prev.role === "title" || prev.role === "heading") gap = 880;
  else if (prev.lastInBlock) gap = 520;
  if (next.role === "title") gap += 360;
  return Math.round(gap / Math.max(0.7, rate));
}

export function bookPercent(book: Book, sentenceId: string | null) {
  const all = spokenIn(book);
  if (all.length <= 1) return 0;
  const index = Math.max(0, all.findIndex((item) => item.id === sentenceId));
  return Math.round((index / (all.length - 1)) * 100);
}

export function formatRate(rate: number) {
  return `${rate.toFixed(2).replace(/0$/, "").replace(/\.$/, ".0")}×`.replace("×", "×");
}

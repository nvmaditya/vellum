import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, Headphones, Pause, Play } from "lucide-react";
import { TypeSheet } from "@/components/vellum/type-sheet";
import { Words } from "@/components/vellum/words";
import {
  LEADING_OPTIONS,
  MARGIN_OPTIONS,
  RATE_STEPS,
  VOICE_OPTIONS,
  bookPercent,
  chapterKicker,
  fontFamily,
  fontSize,
  spokenIn,
  type Book,
  type PageSlice,
  type Settings,
} from "@/lib/reading/model";
import { paginateBook, type Page } from "@/lib/reading/paginate";
import { updateSettings } from "@/lib/reading/store";

function rateLabel(rate: number) {
  return Number.isInteger(rate) ? `${rate.toFixed(1)}×` : `${rate}×`;
}

function sliceKey(slice: PageSlice) {
  if (slice.type === "kicker") return `kicker-${slice.chapterIndex}`;
  if (slice.type === "sentences") return slice.sentences.map((sentence) => sentence.id).join("-");
  return slice.sentenceId;
}

export function ReaderView({
  book,
  settings,
  sentenceId,
  wordIndex,
  speaking,
  voiceNote,
  onBack,
  onListen,
  onStart,
  onStop,
  onPlace,
}: {
  book: Book;
  settings: Settings;
  sentenceId: string | null;
  wordIndex: number;
  speaking: boolean;
  voiceNote: string;
  onBack: () => void;
  onListen: () => void;
  onStart: (sentenceId: string) => void;
  onStop: () => void;
  onPlace: (sentenceId: string) => void;
}) {
  const columnRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [chrome, setChrome] = useState(false);
  const [sheet, setSheet] = useState<"type" | "contents" | null>(null);
  const family = fontFamily(settings.font);
  const size = fontSize(settings.sizeIndex);
  const leading = LEADING_OPTIONS.find((item) => item.id === settings.leading)?.value ?? 1.55;
  const margin = MARGIN_OPTIONS.find((item) => item.id === settings.margin)?.value ?? "1.7rem";
  const spoken = spokenIn(book);
  const current = spoken.find((item) => item.id === sentenceId) ?? spoken[0];
  const found = pages.findIndex((page) => sentenceId != null && page.sentenceIds.includes(sentenceId));
  const pageIndex = found >= 0 ? found : 0;
  const page = pages[pageIndex];
  const chapterItems = spoken.filter((item) => item.chapterIndex === (current?.chapterIndex ?? 0));
  const chapterCursor = Math.max(0, chapterItems.findIndex((item) => item.id === current?.id));

  useLayoutEffect(() => {
    const node = columnRef.current;
    if (!node) return;
    let cancelled = false;
    const run = () => {
      if (cancelled || !columnRef.current) return;
      const next = paginateBook(
        book,
        columnRef.current.clientWidth,
        columnRef.current.clientHeight,
        size,
        family,
        leading,
      );
      setPages(next);
    };
    void document.fonts.ready.then(run);
    const observer = new ResizeObserver(run);
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [book, family, size, leading]);

  function go(delta: number) {
    const nextIndex = Math.min(pages.length - 1, Math.max(0, pageIndex + delta));
    const id = pages[nextIndex]?.sentenceIds[0];
    if (!id || nextIndex === pageIndex) return;
    if (speaking) onStart(id);
    else onPlace(id);
  }

  const goRef = useRef(go);
  goRef.current = go;
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight") goRef.current(1);
      if (event.key === "ArrowLeft") goRef.current(-1);
      if (event.key === " ") {
        event.preventDefault();
        if (!current) return;
        if (speakingRef.current) onStop();
        else onStart(current.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, onStart, onStop]);

  function onFrameClick(event: React.MouseEvent<HTMLElement>) {
    if (sheet) return;
    if (window.getSelection()?.toString()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    if (x < 0.22) {
      go(-1);
      return;
    }
    if (x > 0.78) {
      go(1);
      return;
    }
    const target = (event.target as HTMLElement).closest("[data-sentence]");
    const id = target?.getAttribute("data-sentence");
    if (speaking && id) {
      onStart(id);
      return;
    }
    setChrome((open) => !open);
  }

  function renderSlice(slice: PageSlice) {
    if (slice.type === "kicker") {
      return (
        <p className="kicker" key={sliceKey(slice)}>
          {chapterKicker(slice.chapterIndex)}
        </p>
      );
    }
    if (slice.type === "title" || slice.type === "heading") {
      const Tag = slice.type === "title" ? "h1" : "h2";
      const active = slice.sentenceId === sentenceId;
      return (
        <Tag key={sliceKey(slice)}>
          <span data-sentence={slice.sentenceId} className={active ? "live-sentence" : undefined}>
            {active ? <Words text={slice.text} index={wordIndex} /> : slice.text}
          </span>
        </Tag>
      );
    }
    return (
      <p key={sliceKey(slice)}>
        {slice.sentences.map((sentence, index) => {
          const active = sentence.id === sentenceId;
          return (
            <span
              key={sentence.id}
              data-sentence={sentence.id}
              className={active ? "live-sentence" : undefined}
            >
              {index > 0 ? " " : null}
              {active ? <Words text={sentence.text} index={wordIndex} /> : sentence.text}
            </span>
          );
        })}
      </p>
    );
  }

  const voice = VOICE_OPTIONS.find((item) => item.id === settings.voice) ?? VOICE_OPTIONS[0];

  return (
    <div className="desk" data-theme={settings.theme} data-screen="read">
      <section className="stage">
        <div className="frame" style={{ paddingLeft: margin, paddingRight: margin }} onClick={onFrameClick}>
          <article
            ref={columnRef}
            className="page-column"
            style={{ fontFamily: family, fontSize: size, lineHeight: leading }}
          >
            {page ? page.slices.map(renderSlice) : <h1>{book.chapters[0]?.title ?? book.title}</h1>}
          </article>
        </div>
        <div className="progress-row" style={{ paddingLeft: margin, paddingRight: margin }}>
          <div className="hairline" />
          <span>{bookPercent(book, sentenceId)}%</span>
        </div>
        {chrome ? (
          <div className="chrome" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="icon-btn" aria-label="Library" onClick={onBack}>
              <ChevronLeft size={22} strokeWidth={1.5} />
            </button>
            <button type="button" className="chrome-title" onClick={() => setSheet("contents")}>
              {current ? chapterKicker(current.chapterIndex) : book.title}
            </button>
            <button type="button" className="text-btn" aria-label="Type settings" onClick={() => setSheet("type")}>
              Aa
            </button>
            <button type="button" className="icon-btn" aria-label="Listen with the screen off" onClick={onListen}>
              <Headphones size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={speaking ? "Pause" : "Read aloud"}
              onClick={() => {
                if (!current) return;
                if (speaking) onStop();
                else onStart(current.id);
              }}
            >
              {speaking ? <Pause size={20} strokeWidth={1.5} /> : <Play size={20} strokeWidth={1.5} />}
            </button>
          </div>
        ) : null}
        {speaking ? (
          <div className="playbar" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="icon-btn" aria-label="Pause" onClick={onStop}>
              <Pause size={20} strokeWidth={1.5} />
            </button>
            <input
              className="line"
              type="range"
              min={0}
              max={Math.max(1, chapterItems.length - 1)}
              value={chapterCursor}
              aria-label="Place in chapter"
              onChange={(event) => {
                const item = chapterItems[Number(event.target.value)];
                if (!item) return;
                onStart(item.id);
              }}
            />
            <button
              type="button"
              className="text-btn"
              aria-label="Reading speed"
              onClick={() => {
                const index = RATE_STEPS.indexOf(settings.rate);
                updateSettings({ rate: RATE_STEPS[(index + 1) % RATE_STEPS.length] ?? 1 });
              }}
            >
              {rateLabel(settings.rate)}
            </button>
            <button
              type="button"
              className="text-btn"
              aria-label="Voice"
              onClick={() => {
                const index = VOICE_OPTIONS.findIndex((item) => item.id === settings.voice);
                const next = VOICE_OPTIONS[(index + 1) % VOICE_OPTIONS.length];
                if (next) updateSettings({ voice: next.id });
              }}
            >
              {voice.label}
            </button>
          </div>
        ) : null}
        {voiceNote && !speaking ? <p className="notice">{voiceNote}</p> : null}
        {sheet === "type" ? <TypeSheet settings={settings} onClose={() => setSheet(null)} /> : null}
        {sheet === "contents" ? (
          <>
            <button type="button" className="sheet-backdrop" aria-label="Close contents" onClick={() => setSheet(null)} />
            <div className="sheet" role="dialog" aria-label="Contents">
              <div className="grabber" />
              <p className="section-label">Contents</p>
              <div className="contents">
                {book.chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    type="button"
                    className="chapter-link"
                    data-on={index === current?.chapterIndex}
                    onClick={() => {
                      if (speaking) onStart(chapter.titleSentenceId);
                      else onPlace(chapter.titleSentenceId);
                      setSheet(null);
                    }}
                  >
                    <span className="book-meta">{chapterKicker(index)}</span>
                    <span>{chapter.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

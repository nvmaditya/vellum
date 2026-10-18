import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Bookmark, ChevronLeft, Headphones, Pause, Play } from "lucide-react";
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
import { toggleBookmark, updateSettings, useLibrary } from "@/lib/reading/store";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef(false);
  const swiped = useRef(false);
  const point = useRef<{ x: number; y: number } | null>(null);
  const placedBook = useRef<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [chrome, setChrome] = useState(false);
  const [sheet, setSheet] = useState<"type" | "contents" | null>(null);
  const library = useLibrary();
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
      const width = columnRef.current.clientWidth;
      const measured = columnRef.current.clientHeight;
      const height = measured >= 80 ? measured : Math.max(280, window.innerHeight - 150);
      const next = paginateBook(book, width, height, size, family, leading);
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

  const scrolling = settings.flow !== "page";

  function scrollToSentence(id: string) {
    const root = scrollRef.current;
    if (!root) return;
    const node = root.querySelector(`[data-sentence="${CSS.escape(id)}"]`);
    if (!(node instanceof HTMLElement)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }

  function jumpTo(id: string) {
    jumpRef.current = true;
    if (speaking) onStart(id);
    else onPlace(id);
    if (scrolling) scrollToSentence(id);
  }

  const goRef = useRef(go);
  goRef.current = go;
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;
  const sentenceRef = useRef(sentenceId);
  sentenceRef.current = sentenceId;

  useEffect(() => {
    if (!scrolling || !sentenceId || placedBook.current === book.id) return;
    placedBook.current = book.id;
    scrollToSentence(sentenceId);
  }, [book.id, scrolling, sentenceId]);

  useEffect(() => {
    if (!scrolling || !sentenceId) return;
    if (!speaking && !jumpRef.current) return;
    jumpRef.current = false;
    scrollToSentence(sentenceId);
  }, [sentenceId, speaking, scrolling]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !scrolling) return;
    let frame = 0;
    const onScroll = () => {
      if (speakingRef.current) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const line = root.getBoundingClientRect().top + 96;
        const nodes = root.querySelectorAll<HTMLElement>("[data-sentence]");
        let lo = 0;
        let hi = nodes.length - 1;
        let id: string | null = null;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const node = nodes[mid];
          if (!node) break;
          if (node.getBoundingClientRect().top <= line) {
            id = node.getAttribute("data-sentence");
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        if (id && id !== sentenceRef.current) onPlace(id);
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [scrolling, book.id, onPlace]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        if (scrolling) scrollRef.current?.scrollBy({ top: scrollRef.current.clientHeight * 0.85, behavior: "smooth" });
        else goRef.current(1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        if (scrolling) scrollRef.current?.scrollBy({ top: -scrollRef.current.clientHeight * 0.85, behavior: "smooth" });
        else goRef.current(-1);
      }
      if (event.key === " ") {
        event.preventDefault();
        if (!current) return;
        if (speakingRef.current) onStop();
        else onStart(current.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, onStart, onStop, scrolling]);

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (scrolling) return;
    point.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    if (!point.current || scrolling) return;
    const dx = event.clientX - point.current.x;
    const dy = event.clientY - point.current.y;
    point.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    swiped.current = true;
    go(dx < 0 ? 1 : -1);
  }

  function onFrameClick(event: React.MouseEvent<HTMLElement>) {
    if (sheet) return;
    if (swiped.current) {
      swiped.current = false;
      return;
    }
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
      const active = speaking && slice.sentenceId === sentenceId;
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
  const saved = library.bookmarks.filter((mark) => mark.bookId === book.id);
  const hereSaved = current ? saved.some((mark) => mark.sentenceId === current.id) : false;

  return (
    <div className="desk" data-theme={settings.theme} data-screen="read">
      <section className="stage" data-flow={scrolling ? "scroll" : "page"}>
        {scrolling ? (
          <div
            className="scroller"
            ref={scrollRef}
            onClick={(event) => {
              if (window.getSelection()?.toString()) return;
              const id = (event.target as HTMLElement).closest("[data-sentence]")?.getAttribute("data-sentence");
              if (speaking && id) onStart(id);
            }}
          >
            <article
              className="scroll-column"
              style={{ fontFamily: family, fontSize: size, lineHeight: leading, paddingLeft: margin, paddingRight: margin }}
            >
              {book.chapters.map((chapter, index) => (
                <section key={chapter.id}>
                  <p className="kicker">{chapterKicker(index)}</p>
                  <h1>
                    <span
                      data-sentence={chapter.titleSentenceId}
                      className={speaking && sentenceId === chapter.titleSentenceId ? "live-sentence" : undefined}
                    >
                      {speaking && sentenceId === chapter.titleSentenceId ? (
                        <Words text={chapter.title} index={wordIndex} />
                      ) : (
                        chapter.title
                      )}
                    </span>
                  </h1>
                  {chapter.blocks.map((block) => {
                    const Tag = block.kind === "heading" ? "h2" : "p";
                    return (
                      <Tag key={block.id}>
                        {block.sentences.map((sentence, sentenceIndex) => {
                          const active = speaking && sentence.id === sentenceId;
                          return (
                            <span
                              key={sentence.id}
                              data-sentence={sentence.id}
                              className={active ? "live-sentence" : undefined}
                            >
                              {Tag === "p" && sentenceIndex > 0 ? " " : null}
                              {active ? <Words text={sentence.text} index={wordIndex} /> : sentence.text}
                            </span>
                          );
                        })}
                      </Tag>
                    );
                  })}
                </section>
              ))}
            </article>
          </div>
        ) : (
          <div
            className="frame"
            style={{ paddingLeft: margin, paddingRight: margin }}
            onClick={onFrameClick}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <article
              ref={columnRef}
              className="page-column"
              style={{ fontFamily: family, fontSize: size, lineHeight: leading }}
            >
              {page ? page.slices.map(renderSlice) : <h1>{book.chapters[0]?.title ?? book.title}</h1>}
            </article>
          </div>
        )}
        {scrolling ? null : (
          <div className="progress-row" style={{ paddingLeft: margin, paddingRight: margin }}>
            <div className="hairline" />
            <span>{bookPercent(book, sentenceId)}%</span>
          </div>
        )}
        {chrome || scrolling ? (
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
            <button
              type="button"
              className="icon-btn"
              data-on={hereSaved}
              aria-label={hereSaved ? "Remove bookmark" : "Save this place"}
              aria-pressed={hereSaved}
              onClick={() => {
                if (!current) return;
                const snippet = current.text.length > 64 ? `${current.text.slice(0, 64)}…` : current.text;
                toggleBookmark(book.id, current.id, `${chapterKicker(current.chapterIndex)} · ${snippet}`);
              }}
            >
              <Bookmark size={18} strokeWidth={1.5} fill={hereSaved ? "currentColor" : "none"} />
            </button>
            {scrolling ? null : (
              <button type="button" className="icon-btn" aria-label="Listen with the screen off" onClick={onListen}>
                <Headphones size={20} strokeWidth={1.5} />
              </button>
            )}
            {scrolling ? null : (
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
            )}
          </div>
        ) : null}
        {speaking && !scrolling ? (
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
        {scrolling ? (
          <div className="reader-foot" onClick={(event) => event.stopPropagation()}>
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
            <div className="hairline" />
            <span>{bookPercent(book, sentenceId)}%</span>
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
            <button type="button" className="icon-btn" aria-label="Listen with the screen off" onClick={onListen}>
              <Headphones size={20} strokeWidth={1.5} />
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
              {saved.length ? (
                <>
                  <p className="section-label">Saved</p>
                  <div className="contents">
                    {saved.map((mark) => (
                      <button
                        key={mark.sentenceId}
                        type="button"
                        className="chapter-link"
                        onClick={() => {
                          jumpTo(mark.sentenceId);
                          setSheet(null);
                        }}
                      >
                        <span>{mark.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              <p className="section-label">Contents</p>
              <div className="contents">
                {book.chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    type="button"
                    className="chapter-link"
                    data-on={index === current?.chapterIndex}
                    onClick={() => {
                      jumpTo(chapter.titleSentenceId);
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

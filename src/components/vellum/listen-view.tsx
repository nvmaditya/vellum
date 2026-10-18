import { useEffect, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { CoverMark } from "@/components/vellum/mark";
import { Words } from "@/components/vellum/words";
import { chapterKicker, spokenIn, type Book, type Settings } from "@/lib/reading/model";

function clock(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const remain = whole % 60;
  return `${minutes}:${remain.toString().padStart(2, "0")}`;
}

function secondsFor(text: string, rate: number) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (words / (165 * Math.max(0.7, rate))) * 60;
}

export function ListenView({
  book,
  settings,
  sentenceId,
  wordIndex,
  speaking,
  startedAt,
  sleep,
  onSleep,
  onBack,
  onStart,
  onStop,
  onPlace,
}: {
  book: Book;
  settings: Settings;
  sentenceId: string | null;
  wordIndex: number;
  speaking: boolean;
  startedAt: number;
  sleep: "off" | "15" | "30" | "chapter";
  onSleep: (mode: "off" | "15" | "30" | "chapter") => void;
  onBack: () => void;
  onStart: (sentenceId: string) => void;
  onStop: () => void;
  onPlace: (sentenceId: string) => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!speaking) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 200);
    return () => window.clearInterval(id);
  }, [speaking]);

  const spoken = spokenIn(book);
  const current = spoken.find((item) => item.id === sentenceId) ?? spoken[0];
  const chapter = current ? spoken.filter((item) => item.chapterIndex === current.chapterIndex) : [];
  let before = 0;
  for (const item of chapter) {
    if (item.id === current?.id) break;
    before += secondsFor(item.text, settings.rate);
  }
  const currentSeconds = current ? secondsFor(current.text, settings.rate) : 0;
  const into = speaking && startedAt ? Math.min(currentSeconds, (performance.now() - startedAt) / 1000) : 0;
  const total = chapter.reduce((sum, item) => sum + secondsFor(item.text, settings.rate), 0);
  const elapsed = before + into;
  const remain = Math.max(0, total - elapsed);

  function skip(delta: number) {
    if (!current) return;
    const index = spoken.findIndex((item) => item.id === current.id);
    const next = spoken[index + delta];
    if (!next) return;
    if (speaking) onStart(next.id);
    else onPlace(next.id);
  }

  return (
    <div className="listen" data-screen="listen">
      <div className="listen-inner">
        <CoverMark />
        <h1>{book.title}</h1>
        <p className="chapter">
          {current ? `${chapterKicker(current.chapterIndex)} · ${current.chapterTitle}` : book.author}
        </p>
        <p className="line">
          {current ? (
            speaking ? (
              <Words text={current.text} index={wordIndex} />
            ) : (
              current.text
            )
          ) : (
            "The book is finished."
          )}
        </p>
        <div className="times">
          <span>{clock(elapsed)}</span>
          <span>{`−${clock(remain)}`}</span>
        </div>
        <div className="track" />
        <div className="transport">
          <button type="button" className="icon-btn" aria-label="Previous sentence" onClick={() => skip(-1)}>
            <SkipBack size={22} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="pause-ring"
            aria-label={speaking ? "Pause" : "Play"}
            onClick={() => {
              if (!current) return;
              if (speaking) onStop();
              else onStart(current.id);
            }}
          >
            {speaking ? <Pause size={22} strokeWidth={1.5} /> : <Play size={22} strokeWidth={1.5} />}
          </button>
          <button type="button" className="icon-btn" aria-label="Next sentence" onClick={() => skip(1)}>
            <SkipForward size={22} strokeWidth={1.5} />
          </button>
        </div>
        <div className="sleep" role="group" aria-label="Sleep">
          <p className="sleep-label">Sleep</p>
          {(
            [
              ["off", "Off"],
              ["15", "15"],
              ["30", "30"],
              ["chapter", "Chapter"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className="sleep-chip"
              data-on={sleep === mode}
              aria-pressed={sleep === mode}
              onClick={() => onSleep(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="back-read" onClick={onBack}>
          Back to the page
        </button>
      </div>
    </div>
  );
}

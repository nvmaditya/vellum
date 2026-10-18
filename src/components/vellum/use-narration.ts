import { useCallback, useEffect, useRef, useState } from "react";
import { gapBetween, spokenIn, type Book, type Settings } from "@/lib/reading/model";
import { getLibrary } from "@/lib/reading/store";
import { cancelSpeech, sleep as wait, speakSentence } from "@/lib/reading/speech";

export function useNarration(book: Book | null, settings: Settings) {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const bookRef = useRef(book);
  bookRef.current = book;
  const [sentenceId, setSentenceId] = useState<string | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [voiceNote, setVoiceNote] = useState("");
  const [sleep, setSleep] = useState<"off" | "15" | "30" | "chapter">("off");
  const runRef = useRef(0);
  const sleepRef = useRef(sleep);
  sleepRef.current = sleep;
  const sleepUntil = useRef(0);

  const stop = useCallback(() => {
    runRef.current += 1;
    cancelSpeech();
    setSpeaking(false);
  }, []);

  const place = useCallback((id: string | null) => {
    setSentenceId(id);
    setWordIndex(0);
  }, []);

  const chooseSleep = useCallback((mode: "off" | "15" | "30" | "chapter") => {
    setSleep(mode);
    sleepUntil.current = mode === "15" || mode === "30" ? performance.now() + Number(mode) * 60_000 : 0;
  }, []);

  const start = useCallback(async (fromId: string) => {
    const current = bookRef.current;
    if (!current) return;
    const run = (runRef.current += 1);
    cancelSpeech();
    await wait(40);
    if (run !== runRef.current) return;
    setSpeaking(true);
    setVoiceNote("");
    const flat = spokenIn(current);
    let index = flat.findIndex((item) => item.id === fromId);
    if (index < 0) index = 0;
    while (run === runRef.current && index < flat.length) {
      const item = flat[index];
      const previous = index > 0 ? flat[index - 1] : null;
      const mode = sleepRef.current;
      const chapterEnds = mode === "chapter" && previous && item.chapterIndex !== previous.chapterIndex;
      const timeEnds = (mode === "15" || mode === "30") && performance.now() >= sleepUntil.current;
      if (chapterEnds || timeEnds) {
        setSpeaking(false);
        setSleep("off");
        return;
      }
      const gap = gapBetween(previous, item, settingsRef.current.rate);
      if (gap > 0) {
        await wait(gap);
        if (run !== runRef.current) break;
      }
      setSentenceId(item.id);
      setWordIndex(0);
      setStartedAt(performance.now());
      const result = await speakSentence(item.text, settingsRef.current, (word) => {
        if (run === runRef.current) setWordIndex(word);
      });
      if (run !== runRef.current) break;
      if (result === "unavailable") {
        setVoiceNote("No speaking voice is available here. You can still read the page.");
        setSpeaking(false);
        return;
      }
      index += 1;
    }
    if (run === runRef.current) setSpeaking(false);
  }, []);

  useEffect(() => {
    if (!book) return;
    const saved = getLibrary().positions[book.id];
    const flat = spokenIn(book);
    const next = saved && flat.some((item) => item.id === saved) ? saved : (flat[0]?.id ?? null);
    runRef.current += 1;
    cancelSpeech();
    setSpeaking(false);
    setSentenceId(next);
    setWordIndex(0);
    setVoiceNote("");
    setSleep("off");
  }, [book]);

  useEffect(() => {
    const session = navigator.mediaSession;
    const current = bookRef.current;
    if (!session || !current) return;
    const flat = spokenIn(current);
    const item = flat.find((entry) => entry.id === sentenceId) ?? flat[0];
    if (!item) return;
    session.metadata = new MediaMetadata({
      title: current.title,
      artist: item.chapterTitle,
      album: "Vellum",
    });
    session.playbackState = speaking ? "playing" : "paused";
    const jump = (delta: number) => {
      const index = flat.findIndex((entry) => entry.id === item.id);
      const next = flat[index + delta];
      if (!next) return;
      if (speaking) void start(next.id);
      else place(next.id);
    };
    const set = (name: MediaSessionAction, handler: () => void) => {
      try {
        session.setActionHandler(name, handler);
      } catch {
        /* this browser does not offer that control */
      }
    };
    set("play", () => void start(item.id));
    set("pause", stop);
    set("previoustrack", () => jump(-1));
    set("nexttrack", () => jump(1));
  }, [book, sentenceId, speaking, start, stop, place]);

  useEffect(() => {
    const warm = () => window.speechSynthesis?.getVoices();
    warm();
    window.speechSynthesis?.addEventListener("voiceschanged", warm);
    return () => {
      runRef.current += 1;
      cancelSpeech();
      window.speechSynthesis?.removeEventListener("voiceschanged", warm);
    };
  }, []);

  return { sentenceId, wordIndex, speaking, startedAt, voiceNote, sleep, chooseSleep, start, stop, place };
}

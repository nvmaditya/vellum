import { useCallback, useEffect, useRef, useState } from "react";
import { gapBetween, spokenIn, type Book, type Settings } from "@/lib/reading/model";
import { getLibrary } from "@/lib/reading/store";
import { cancelSpeech, sleep, speakSentence } from "@/lib/reading/speech";

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
  const runRef = useRef(0);

  const stop = useCallback(() => {
    runRef.current += 1;
    cancelSpeech();
    setSpeaking(false);
  }, []);

  const place = useCallback((id: string | null) => {
    setSentenceId(id);
    setWordIndex(0);
  }, []);

  const start = useCallback(async (fromId: string) => {
    const current = bookRef.current;
    if (!current) return;
    const run = (runRef.current += 1);
    cancelSpeech();
    await sleep(40);
    if (run !== runRef.current) return;
    setSpeaking(true);
    setVoiceNote("");
    const flat = spokenIn(current);
    let index = flat.findIndex((item) => item.id === fromId);
    if (index < 0) index = 0;
    while (run === runRef.current && index < flat.length) {
      const item = flat[index];
      const previous = index > 0 ? flat[index - 1] : null;
      const gap = gapBetween(previous, item, settingsRef.current.rate);
      if (gap > 0) {
        await sleep(gap);
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
  }, [book]);

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

  return { sentenceId, wordIndex, speaking, startedAt, voiceNote, start, stop, place };
}

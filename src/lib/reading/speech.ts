import { type Settings, type VoiceId } from "@/lib/reading/model";

function voices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function byName(list: SpeechSynthesisVoice[], pattern: RegExp) {
  return list.find((voice) => pattern.test(voice.name));
}

export function pickVoice(id: VoiceId) {
  const all = voices();
  const english = all.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const pool = english.length ? english : all;
  if (!pool.length) return undefined;
  if (id === "jonah") {
    return (
      byName(pool, /google uk english male|daniel|david|alex|rishi|fred|male/i) ??
      pool.find((voice) => /en-GB/i.test(voice.lang)) ??
      pool[0]
    );
  }
  if (id === "helen") {
    return (
      byName(pool, /google uk english female|serena|kate|fiona|stephanie/i) ??
      pool.find((voice) => /en-GB/i.test(voice.lang)) ??
      pool[0]
    );
  }
  return (
    byName(pool, /google uk english female|google us english|samantha|victoria|zira|female/i) ??
    pool[0]
  );
}

export function speakSentence(
  text: string,
  settings: Pick<Settings, "rate" | "voice">,
  onWord: (index: number) => void,
): Promise<"spoken" | "unavailable"> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve("unavailable");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    const voice = pickVoice(settings.voice);
    if (voice) utterance.voice = voice;
    const started = performance.now();
    utterance.onstart = () => onWord(0);
    utterance.onboundary = (event) => {
      if (event.name && event.name !== "word") return;
      const index = text.slice(0, event.charIndex).split(/\s+/).filter(Boolean).length;
      onWord(index);
    };
    utterance.onerror = () => resolve("unavailable");
    utterance.onend = () => {
      if (performance.now() - started < 80) resolve("unavailable");
      else resolve("spoken");
    };
    window.speechSynthesis.speak(utterance);
  });
}

export function cancelSpeech() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

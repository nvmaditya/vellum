import { type Settings, type VoiceId } from "@/lib/reading/model";

type NativeSpeech = {
  speak: (text: string, rate: number, id: string) => void;
  stop: () => void;
};

type NativeWait = {
  id: string;
  resolve: (value: "spoken" | "unavailable") => void;
  timer: number;
};

let nativeWait: NativeWait | null = null;
let nativeWord: ((index: number) => void) | null = null;

function nativeSpeech(): NativeSpeech | null {
  if (typeof window === "undefined") return null;
  const native = (window as unknown as { VellumTts?: Partial<NativeSpeech> }).VellumTts;
  if (!native || typeof native.speak !== "function" || typeof native.stop !== "function") return null;
  return native as NativeSpeech;
}

export function installSpeechHooks() {
  const host = window as unknown as {
    __vellumSpeechDone?: (id: string) => void;
    __vellumSpeechWord?: (id: string, index: number) => void;
  };
  host.__vellumSpeechDone = (id) => {
    if (!nativeWait || nativeWait.id !== id) return;
    const pending = nativeWait;
    nativeWait = null;
    window.clearTimeout(pending.timer);
    pending.resolve("spoken");
  };
  host.__vellumSpeechWord = (id, index) => {
    if (nativeWait?.id === id) nativeWord?.(index);
  };
}

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
      byName(pool, /male|daniel|david|alex|rishi|fred/i) ??
      pool.find((voice) => /en-GB/i.test(voice.lang)) ??
      pool[0]
    );
  }
  if (id === "helen") {
    return byName(pool, /uk|british|serena|kate|fiona/i) ?? pool[0];
  }
  return byName(pool, /us english|samantha|female/i) ?? pool[0];
}

function finishLater(
  resolve: (value: "spoken" | "unavailable") => void,
  text: string,
  rate: number,
) {
  let settled = false;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const timer = window.setTimeout(
    () => done("spoken"),
    Math.max(2500, (words / (2.4 * Math.max(0.7, rate))) * 1000 + 1200),
  );
  function done(value: "spoken" | "unavailable") {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    resolve(value);
  }
  return done;
}

export function speakSentence(
  text: string,
  settings: Pick<Settings, "rate" | "voice">,
  onWord: (index: number) => void,
): Promise<"spoken" | "unavailable"> {
  const native = nativeSpeech();
  if (native) {
    return new Promise((resolve) => {
      const id = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const timer = window.setTimeout(() => {
        if (nativeWait?.id !== id) return;
        nativeWait = null;
        resolve("spoken");
      }, Math.max(4000, (words / (2.2 * Math.max(0.7, settings.rate))) * 1000 + 2000));
      nativeWord = onWord;
      nativeWait = { id, resolve, timer };
      try {
        native.speak(text, settings.rate, id);
        onWord(0);
      } catch {
        window.clearTimeout(timer);
        nativeWait = null;
        resolve("unavailable");
      }
    });
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve("unavailable");
      return;
    }
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = settings.rate;
    const voice = pickVoice(settings.voice);
    if (voice) utterance.voice = voice;
    const done = finishLater(resolve, text, settings.rate);
    utterance.onstart = () => onWord(0);
    utterance.onboundary = (event) => {
      if (event.name && event.name !== "word") return;
      const index = text.slice(0, event.charIndex).split(/\s+/).filter(Boolean).length;
      onWord(index);
    };
    utterance.onerror = (event) => {
      if (event.error === "canceled" || event.error === "interrupted") done("spoken");
      else done("unavailable");
    };
    utterance.onend = () => done("spoken");
    synth.speak(utterance);
    if (synth.paused) synth.resume();
  });
}

export function cancelSpeech() {
  const native = nativeSpeech();
  try {
    native?.stop();
  } catch {
    /* the voice engine is already gone */
  }
  if (nativeWait) {
    const pending = nativeWait;
    nativeWait = null;
    window.clearTimeout(pending.timer);
    pending.resolve("spoken");
  }
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

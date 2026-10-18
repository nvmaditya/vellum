import { useSyncExternalStore } from "react";
import {
  defaultSettings,
  SAMPLE_ID,
  type Book,
  type Settings,
} from "@/lib/reading/model";
import { sampleBook } from "@/lib/reading/sample";

const KEY = "vellum-v1";

export type LibraryState = {
  books: Book[];
  settings: Settings;
  positions: Record<string, string>;
  notice: string;
};

const sample = sampleBook();

let state: LibraryState = {
  books: [sample],
  settings: defaultSettings,
  positions: {},
  notice: "",
};

let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  try {
    const payload = {
      settings: state.settings,
      positions: state.positions,
      books: state.books.filter((book) => book.id !== SAMPLE_ID),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
    if (state.notice.startsWith("This browser")) {
      state = { ...state, notice: "" };
    }
  } catch {
    state = {
      ...state,
      notice: "This browser couldn't store that book. It will stay until you refresh.",
    };
  }
}

export function getLibrary() {
  return state;
}

export function subscribeLibrary(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLibrary() {
  return useSyncExternalStore(subscribeLibrary, getLibrary, getLibrary);
}

export function hydrateLibrary() {
  if (hydrated || typeof localStorage === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<LibraryState>;
    const imported = Array.isArray(parsed.books)
      ? parsed.books.filter(isBook).filter((book) => book.id !== SAMPLE_ID)
      : [];
    state = {
      books: [sample, ...imported],
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
      positions:
        parsed.positions && typeof parsed.positions === "object" ? parsed.positions : {},
      notice: "",
    };
    emit();
  } catch {
    state = { ...state, notice: "Saved books couldn't be read. The sample is still here." };
    emit();
  }
}

function isBook(value: unknown): value is Book {
  if (!value || typeof value !== "object") return false;
  const book = value as Book;
  return typeof book.id === "string" && typeof book.title === "string" && Array.isArray(book.chapters);
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  persist();
  emit();
}

export function setNotice(notice: string) {
  state = { ...state, notice };
  emit();
}

export function rememberPosition(bookId: string, sentenceId: string) {
  if (state.positions[bookId] === sentenceId) return;
  state = { ...state, positions: { ...state.positions, [bookId]: sentenceId } };
  persist();
  emit();
}

export function addBook(book: Book) {
  state = {
    ...state,
    notice: "",
    books: [sample, book, ...state.books.filter((item) => item.id !== SAMPLE_ID && item.id !== book.id)],
  };
  persist();
  emit();
}

export function removeBook(bookId: string) {
  if (bookId === SAMPLE_ID) return;
  const positions = { ...state.positions };
  delete positions[bookId];
  state = {
    ...state,
    positions,
    books: state.books.filter((book) => book.id !== bookId),
  };
  persist();
  emit();
}

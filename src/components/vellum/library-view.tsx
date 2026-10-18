import { useRef, useState } from "react";
import { CoverMark } from "@/components/vellum/mark";
import { bookPercent, chapterKicker, spokenIn, type Book } from "@/lib/reading/model";
import { parseEpub } from "@/lib/reading/epub";
import { addBook, removeBook, setNotice, type LibraryState } from "@/lib/reading/store";

function progressLabel(book: Book, sentenceId: string | undefined) {
  if (!sentenceId) return "Not started";
  const spoken = spokenIn(book);
  const current = spoken.find((item) => item.id === sentenceId);
  if (!current) return "Not started";
  const percent = bookPercent(book, sentenceId);
  if (percent <= 0) return "Not started";
  return `${chapterKicker(current.chapterIndex)} · ${percent}%`;
}

export function LibraryView({
  library,
  onOpen,
}: {
  library: LibraryState;
  onOpen: (bookId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setNotice("");
    try {
      if (!file.name.toLowerCase().endsWith(".epub")) {
        throw new Error("Choose an epub file.");
      }
      const book = await parseEpub(await file.arrayBuffer(), file.name);
      addBook(book);
      onOpen(book.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn't open that file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="desk" data-theme={library.settings.theme} data-screen="library">
      <main className="stage">
        <div className="library">
          <h1>Library</h1>
          <p className="lede">Read on the page, or listen with the screen off.</p>
          {library.books.map((book) => (
            <div key={book.id}>
              <button type="button" className="book-row" onClick={() => onOpen(book.id)}>
                <CoverMark />
                <span>
                  <span className="book-title">{book.title}</span>
                  <span className="book-meta">{book.author}</span>
                  <span className="book-meta">
                    {progressLabel(book, library.positions[book.id])}
                  </span>
                </span>
              </button>
              {book.source === "import" ? (
                <div className="book-actions">
                  <button type="button" className="quiet-link" onClick={() => removeBook(book.id)}>
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="open-epub"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "Opening…" : "Open an epub"}
          </button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept=".epub,application/epub+zip"
            aria-label="Choose an epub"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <p className="notice" role="status">
            {library.notice}
          </p>
          <p className="book-meta">Tap the middle of a page for type and voice.</p>
        </div>
      </main>
    </div>
  );
}

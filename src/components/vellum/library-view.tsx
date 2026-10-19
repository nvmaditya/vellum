import { useRef, useState } from "react";
import { CoverMark } from "@/components/vellum/mark";
import { bookPercent, chapterKicker, spokenIn, type Book } from "@/lib/reading/model";
import { APP_VERSION } from "@/lib/reading/version";
import { parseEpub } from "@/lib/reading/epub";
import { addBook, removeBook, setNotice, type LibraryState } from "@/lib/reading/store";

function progressOf(book: Book, sentenceId: string | undefined) {
  if (!sentenceId) return { label: "Not started", percent: 0 };
  const spoken = spokenIn(book);
  const current = spoken.find((item) => item.id === sentenceId);
  const percent = bookPercent(book, sentenceId);
  if (!current || percent <= 0) return { label: "Not started", percent: 0 };
  return { label: `${chapterKicker(current.chapterIndex)} · ${percent}%`, percent };
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
  const books = library.books;

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
        <div className="home">
          <header className="home-top">
            <p className="kicker">Vellum</p>
            <h1>Library</h1>
            <p className="lede">Books you add stay on this phone.</p>
          </header>
          {books.length === 0 ? (
            <section className="empty-shelf">
              <CoverMark />
              <h2>Nothing here yet</h2>
              <p>Add an epub to start reading or listening.</p>
            </section>
          ) : (
            <ul className="shelf">
              {books.map((book) => {
                const progress = progressOf(book, library.positions[book.id]);
                return (
                  <li key={book.id} className="shelf-card">
                    <button type="button" className="shelf-open" onClick={() => onOpen(book.id)}>
                      <CoverMark />
                      <span>
                        <span className="book-title">{book.title}</span>
                        <span className="book-meta">{book.author}</span>
                        <span className="shelf-track" aria-hidden="true">
                          <span style={{ width: `${progress.percent}%` }} />
                        </span>
                        <span className="book-meta">{progress.label}</span>
                      </span>
                    </button>
                    <button type="button" className="quiet-link" onClick={() => removeBook(book.id)}>
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" className="open-epub" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Adding…" : "Add a book"}
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
          <p className="book-meta home-version">v{APP_VERSION}</p>
        </div>
      </main>
    </div>
  );
}

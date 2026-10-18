import { useEffect, useLayoutEffect, useState } from "react";
import { LibraryView } from "@/components/vellum/library-view";
import { ListenView } from "@/components/vellum/listen-view";
import { ReaderView } from "@/components/vellum/reader-view";
import { useNarration } from "@/components/vellum/use-narration";
import { hydrateLibrary, rememberPosition, useLibrary } from "@/lib/reading/store";

type Screen = "library" | "read" | "listen";

export function VellumApp() {
  const library = useLibrary();
  const [screen, setScreen] = useState<Screen>("library");
  const [bookId, setBookId] = useState<string | null>(null);
  const book = library.books.find((item) => item.id === bookId) ?? null;
  const narration = useNarration(book, library.settings);

  useLayoutEffect(() => {
    hydrateLibrary();
  }, []);

  useEffect(() => {
    if (book && narration.sentenceId) rememberPosition(book.id, narration.sentenceId);
  }, [book, narration.sentenceId]);

  function openBook(id: string) {
    setBookId(id);
    setScreen("read");
  }

  if (screen === "listen" && book) {
    return (
      <ListenView
        book={book}
        settings={library.settings}
        sentenceId={narration.sentenceId}
        wordIndex={narration.wordIndex}
        speaking={narration.speaking}
        startedAt={narration.startedAt}
        onBack={() => setScreen("read")}
        onStart={narration.start}
        onStop={narration.stop}
        onPlace={narration.place}
      />
    );
  }

  if (screen !== "library" && book) {
    return (
      <ReaderView
        book={book}
        settings={library.settings}
        sentenceId={narration.sentenceId}
        wordIndex={narration.wordIndex}
        speaking={narration.speaking}
        voiceNote={narration.voiceNote}
        onBack={() => {
          narration.stop();
          setScreen("library");
        }}
        onListen={() => {
          setScreen("listen");
          if (!narration.speaking && narration.sentenceId) narration.start(narration.sentenceId);
        }}
        onStart={narration.start}
        onStop={narration.stop}
        onPlace={narration.place}
      />
    );
  }

  return <LibraryView library={library} onOpen={openBook} />;
}

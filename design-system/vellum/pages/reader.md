# Reader

The generated master palette is a marketing hero (red on pink). It does not fit this book. The reader keeps the paper, sepia, gray, and night themes already in the app: warm paper, ink, and a serif page.

## Flow

- The book opens as a vertical scroll. That is the primary gesture. Horizontal swipe is not used on the scrolling page, so it does not fight the system back gesture.
- A bar stays at the top and a bar stays at the bottom. Text scrolls between them and is not hidden underneath. Both bars clear the safe area.
- Top bar: library, chapter (opens contents), type, bookmark.
- Bottom bar: play and pause, progress, speed, listen with the screen off.
- Tap a sentence while the voice is on to move the voice there. The page follows the sentence being spoken.
- Page mode remains in the type sheet. In that mode, a sideways swipe turns the page, and the left and right edges do the same. Arrow keys do it too.
- Pull-to-refresh is off on the page (`overscroll-behavior: contain`).
- Motion is limited to following the spoken sentence. Paragraphs do not fade in. Reduced motion uses an instant jump.

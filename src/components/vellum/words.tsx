export function Words({ text, index }: { text: string; index: number }) {
  const parts = text.split(/(\s+)/);
  let word = 0;
  return parts.map((part, partIndex) => {
    if (/^\s+$/.test(part)) return <span key={partIndex}>{part}</span>;
    const current = word === index;
    word += 1;
    return (
      <span key={partIndex} className={current ? "live-word" : undefined}>
        {part}
      </span>
    );
  });
}

export function CoverMark({ className = "mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true">
      <rect width="80" height="80" className="mark-navy" />
      <polygon points="0,0 80,0 0,80" className="mark-paper" />
      <polygon points="46,34 80,34 80,80 46,80" className="mark-navy-deep" />
    </svg>
  );
}

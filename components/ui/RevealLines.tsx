import type { ElementType } from "react";

interface Props {
  lines: string[];
  as?: ElementType;
  className?: string;
  id?: string;
  /** "intro" lines are animated by the Hero timeline, everything else by scroll. */
  mode?: "scroll" | "intro";
}

/** Headline split into masked lines; GSAP animates `.rv-inner` (see Experience → useGlobalReveals). */
export default function RevealLines({ lines, as: Tag = "h2", className = "", id, mode = "scroll" }: Props) {
  return (
    <Tag id={id} className={className} data-reveal={mode}>
      {lines.map((line, i) => (
        <span className="rv-line" key={i}>
          <span className="rv-inner">{line}</span>
          {i < lines.length - 1 && <span className="sr-only"> </span>}
        </span>
      ))}
    </Tag>
  );
}

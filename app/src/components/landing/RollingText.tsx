// Per-letter rolling label: each character slides up and is replaced by a copy from
// below, staggered slightly. Needs a `group` class on the hovered ancestor.
export default function RollingText({ text }: { text: string }) {
  return (
    <span className="relative inline-flex" aria-label={text}>
      {Array.from(text).map((ch, i) => {
        const glyph = ch === " " ? " " : ch
        const delay = { transitionDelay: `${i * 14}ms` }
        return (
          <span key={i} aria-hidden className="relative inline-block overflow-hidden leading-[1.15]">
            <span
              style={delay}
              className="block transition-transform duration-[420ms] ease-entrance group-hover:-translate-y-full"
            >
              {glyph}
            </span>
            <span
              style={delay}
              className="absolute top-0 left-0 block translate-y-full transition-transform duration-[420ms] ease-entrance group-hover:translate-y-0"
            >
              {glyph}
            </span>
          </span>
        )
      })}
    </span>
  )
}

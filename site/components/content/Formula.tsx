import katex from "katex";

/**
 * A math formula, drawn with KaTeX when the page is built (no math JavaScript
 * reaches the browser). KaTeX also writes MathML, so screen readers read the
 * formula; `label` adds a plain-English version for everyone.
 * Only our own fixed formula strings go in here, never user input.
 */
export function Formula({ tex, label }: { tex: string; label: string }) {
  const html = katex.renderToString(tex, { displayMode: true, output: "htmlAndMathml", throwOnError: true });
  return (
    <div className="min-w-0">
      <div
        // Long formulas scroll sideways on phones, so the box can take keyboard focus.
        tabIndex={0}
        role="group"
        aria-label={label}
        className="focus-ring overflow-x-auto rounded-control bg-mist-50 px-4 py-2 text-navy-900"
        // Built from our fixed formula strings at build time.
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="mt-2 text-sm text-ink-600">{label}</p>
    </div>
  );
}

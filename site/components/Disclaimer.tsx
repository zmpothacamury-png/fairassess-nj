/**
 * Required on every page, every results page, and every checker result
 * (disclaimer rule). Word for word. Do not shorten or reword it.
 */
export const DISCLAIMER_TEXT =
  "Fair Assess NJ is an independent student research project that uses public data. It is not legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, and forms with the Bergen County Board of Taxation.";

/** The disclaimer as a paragraph. `tone` picks colors for light or dark surfaces. */
export function Disclaimer({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={`max-w-prose text-sm ${
        tone === "dark" ? "text-outline-200" : "text-ink-600"
      } ${className}`}
    >
      {DISCLAIMER_TEXT}
    </p>
  );
}

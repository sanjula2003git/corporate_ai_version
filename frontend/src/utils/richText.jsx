// richText.jsx — a minimal **bold** renderer for AI chat bubbles.
//
// The assistant (and the offline mock) reply with markdown-style **bold**
// emphasis, e.g. "Open **My Assignments**". Rendering the raw string would
// show the literal asterisks, so this splits the text on **...** and turns
// those spans into real <strong> elements. Everything else stays plain text
// (React still escapes it, so there's no XSS risk).
export function renderRichText(text) {
  if (!text) return text;
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    return m ? <strong key={i}>{m[1]}</strong> : part;
  });
}

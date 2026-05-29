import "server-only";
import sanitizeHtml from "sanitize-html";

// TipTap'ın ürettiği standart HTML elemanları izin listesi.
// Script, iframe, event handler ve tehlikeli attribute'lar engellenir.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "div", "span",
];

const ALLOWED_ATTR: sanitizeHtml.IOptions["allowedAttributes"] = {
  a:   ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  td:  ["colspan", "rowspan"],
  th:  ["colspan", "rowspan"],
  "*": ["class"],
};

export function sanitizeBlogContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags:       ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedSchemes:    ["https", "http", "mailto"],
    // <a> target="_blank" için rel="noopener noreferrer" zorla
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

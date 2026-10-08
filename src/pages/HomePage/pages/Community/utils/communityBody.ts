import DOMPurify from "dompurify";

/**
 * Community post/comment bodies come in two shapes:
 * - rich text from the mobile editor, wrapped in `<html>...</html>`;
 * - legacy plain text, newlines preserved.
 *
 * The backend sanitizes on write; everything here sanitizes again before
 * rendering (defense in depth).
 */

const ALLOWED_TAGS = [
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "code",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "codeblock",
  "pre",
  "mention",
];

const ALLOWED_ATTR = ["href", "checked", "data-type", "text", "indicator", "id"];

const BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "PRE",
  "CODEBLOCK",
]);

const SAFE_HREF = /^(https?:|mailto:|tel:)/i;

export const MENTION_CLASS =
  "community-mention rounded bg-amber-100 px-1 font-semibold text-amber-900";

/** True when the body is rich text from the mobile editor. */
export const isCommunityHtml = (body: string | null | undefined): boolean =>
  /^<html[\s>]/i.test((body ?? "").trim());

const mentionLabel = (el: Element): string => {
  const inner = (el.textContent ?? "").trim();
  if (inner) return inner;
  const text = el.getAttribute("text") ?? "";
  return text ? `${el.getAttribute("indicator") ?? "@"}${text}` : "";
};

const sanitizeToFragment = (body: string): DocumentFragment | null => {
  if (!DOMPurify.isSupported) return null;
  return DOMPurify.sanitize(body.trim(), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    RETURN_DOM_FRAGMENT: true,
  });
};

const replaceWith = (el: Element, tag: string): HTMLElement => {
  const next = el.ownerDocument.createElement(tag);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
  return next;
};

interface RenderOptions {
  /** Render links as plain styled text (for bodies inside a clickable card). */
  inertLinks?: boolean;
}

/**
 * Sanitized, render-ready HTML for a rich-text body. Mentions become styled
 * spans, `<codeblock>` becomes `<pre>`, checkbox list items get a marker.
 * Returns "" for plain-text bodies — render those as text instead.
 */
export const communityBodyToHtml = (
  body: string | null | undefined,
  { inertLinks = false }: RenderOptions = {}
): string => {
  if (!body || !isCommunityHtml(body)) return "";
  const fragment = sanitizeToFragment(body);
  if (!fragment) return "";

  fragment.querySelectorAll("mention").forEach((el) => {
    const span = el.ownerDocument.createElement("span");
    span.className = MENTION_CLASS;
    const id = el.getAttribute("id");
    if (id) span.setAttribute("data-user-id", id);
    span.textContent = mentionLabel(el);
    el.replaceWith(span);
  });

  fragment.querySelectorAll("codeblock").forEach((el) => {
    replaceWith(el, "pre");
  });

  fragment.querySelectorAll('ul[data-type="checkbox"]').forEach((ul) => {
    (ul as HTMLElement).style.listStyle = "none";
    (ul as HTMLElement).style.paddingLeft = "0.25rem";
  });

  fragment.querySelectorAll('ul[data-type="checkbox"] > li').forEach((li) => {
    const checked = li.hasAttribute("checked") && li.getAttribute("checked") !== "false";
    li.setAttribute("data-checked", checked ? "true" : "false");
    li.prepend(li.ownerDocument.createTextNode(checked ? "☑ " : "☐ "));
    li.removeAttribute("checked");
  });

  fragment.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (inertLinks || !SAFE_HREF.test(href)) {
      const span = replaceWith(a, "span");
      span.className = "underline";
      return;
    }
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  // Strip any stray ids so user content can't collide with page anchors.
  fragment.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

  const container = document.createElement("div");
  container.appendChild(fragment);
  return container.innerHTML;
};

const collectText = (node: Node, out: string[]) => {
  if (node.nodeType === Node.TEXT_NODE) {
    out.push(node.textContent ?? "");
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  const el = node as Element;
  const tag = el.tagName ?? "";
  if (tag === "BR") {
    out.push("\n");
    return;
  }
  if (tag === "MENTION") {
    out.push(mentionLabel(el));
    return;
  }
  const block = BLOCK_TAGS.has(tag);
  if (block) out.push("\n");
  if (tag === "LI") out.push("• ");
  node.childNodes.forEach((child) => collectText(child, out));
  if (block) out.push("\n");
};

/**
 * A plain string for any body — for table cells, titles, search, notification
 * text and truncation. Plain-text bodies pass through unchanged.
 */
export const communityBodyToPlainText = (
  body: string | null | undefined
): string => {
  if (!body) return "";
  if (!isCommunityHtml(body)) return body;

  const fragment = sanitizeToFragment(body);
  const text = fragment
    ? (() => {
        const out: string[] = [];
        collectText(fragment, out);
        return out.join("");
      })()
    : body
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|h[1-6]|li|blockquote|codeblock)>/gi, "\n")
        .replace(/<[^>]*>/g, "");

  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * Security & Sanitization Utilities for KCA-MMS
 * Protects against XSS, script injection, and unsafe attributes in rich-text and user inputs.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'div', 'span', 'blockquote', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
]);

const FORBIDDEN_ATTRS_REGEX = /^on[a-z]+|style|src|href|action|data/i;

/**
 * Sanitizes rich HTML string, stripping dangerous scripts, event handlers, and iframe tags.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  if (typeof window === 'undefined' || !window.DOMParser) {
    // Basic regex fallback if executed outside browser
    return rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Recursively clean node tree
    function cleanNode(node: Node) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          // Remove disallowed tags
          if (!ALLOWED_TAGS.has(tagName)) {
            // Replace with its text contents or remove
            if (tagName === 'script' || tagName === 'iframe' || tagName === 'object' || tagName === 'embed') {
              el.remove();
              continue;
            } else {
              // Unwrap allowed contents
              while (el.firstChild) {
                el.parentNode?.insertBefore(el.firstChild, el);
              }
              el.remove();
              continue;
            }
          }

          // Strip dangerous attributes (e.g. onerror, onload, onclick)
          const attrNames = Array.from(el.attributes).map(a => a.name);
          for (const attr of attrNames) {
            const val = el.getAttribute(attr) || '';
            if (attr.toLowerCase().startsWith('on') || val.toLowerCase().includes('javascript:') || val.toLowerCase().includes('data:text/html')) {
              el.removeAttribute(attr);
            }
          }

          cleanNode(el);
        }
      }
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch (err) {
    console.error('HTML Sanitization error:', err);
    return rawHtml.replace(/<[^>]*>?/gm, ''); // safe strip all tags on error
  }
}

/**
 * Sanitizes user text input, trimming and removing potential null-byte injections.
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\0/g, '').trim();
}

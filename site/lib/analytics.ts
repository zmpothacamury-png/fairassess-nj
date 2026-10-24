/**
 * Vercel Web Analytics (Zaden approved page views only). The
 * site sends no custom events. Before each page view is sent, this removes
 * the ?query and #hash from the URL, so only the page path is counted.
 */
export function stripQueryAndHash<E extends { url: string }>(event: E): E {
  const url = new URL(event.url);
  url.search = "";
  url.hash = "";
  return { ...event, url: url.toString() };
}

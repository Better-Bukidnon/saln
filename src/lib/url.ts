// Returns the URL only if it parses and is http(s); anything else (javascript:, data:, relative) is null.
export function safeHref(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

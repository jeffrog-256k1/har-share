import { relative, type Result, type SafeEntry } from './core.ts';
import { t, type Language } from './i18n.ts';
const escape = (value: string | number) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function extent(result: Result) {
  return Math.max(1, ...result.har.log.entries.map((e) => relative(e) + e.time));
}
export function bar(entry: SafeEntry, total: number) {
  const x = (relative(entry) / total) * 300,
    width = Math.max(1, (entry.time / total) * 300);
  return { x, width };
}
export async function makeHtml(result: Result, language: Language) {
  const css =
    'body{margin:40px;color:#242821;background:#f4f2eb;font:13px monospace}h1{font:48px Arial,sans-serif;letter-spacing:-2px}p{max-width:900px;line-height:1.8}table{border-collapse:collapse;width:100%;min-width:720px}th,td{text-align:left;padding:14px 10px;border-bottom:1px solid #d1cec5}small{display:block;margin-top:5px;color:#686a60}.scroll{overflow:auto}.note{padding:20px;border:1px solid #c5bba0;margin:25px 0}svg{width:300px;height:18px}';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(css));
  const hash = btoa(String.fromCharCode(...new Uint8Array(digest)));
  const total = extent(result),
    rows = result.har.log.entries
      .map((e) => {
        const { x, width } = bar(e, total);
        return `<tr><td>${escape(e.request.method)} ${escape(e.request.url)}<small>${escape(e.response.content.mimeType)}</small></td><td>${e.response.status}</td><td>${e.response.content.size} B</td><td><svg viewBox="0 0 300 18" xmlns="http://www.w3.org/2000/svg"><rect x="${x}" y="2" width="${width}" height="14" fill="${e.response.status >= 400 ? '#b94f34' : '#577567'}"/></svg><small>${relative(e)} ms + ${Math.round(e.time * 100) / 100} ms</small></td></tr>`;
      })
      .join('');
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'sha256-${hash}'; base-uri 'none'; form-action 'none'"><title>HAR Share</title><style>${css}</style></head><body><p>HAR SHARE / 0.1</p><h1>${escape(t(language, 'waterfall'))}</h1><p>${escape(t(language, 'how'))}</p><p class="note">${escape(t(language, 'note'))}</p><p>${result.har.log.entries.length} ${escape(t(language, 'requests'))} · ${result.summary.hosts} ${escape(t(language, 'hosts'))}</p><div class="scroll"><table><thead><tr>${['request', 'status', 'size', 'timing'].map((k) => '<th>' + escape(t(language, k)) + '</th>').join('')}</tr></thead><tbody>${rows}</tbody></table></div><p>HAR Share · jeffrog-256k1 · MIT</p></body></html>`;
}

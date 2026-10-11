import './style.css';
import { MAX_BYTES, relative, type Result } from './core.ts';
import { t, type Language } from './i18n.ts';
import { sample } from './sample.ts';
import { makeHtml, bar, extent } from './report.ts';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let language: Language = 'en',
  result: Result | null = null,
  worker: Worker | null = null,
  timer: ReturnType<typeof setTimeout> | undefined,
  page = 0,
  state = 'idle';
const node = (tag: string, text: string) => {
  const n = document.createElement(tag);
  n.textContent = text;
  return n;
};
function render() {
  document.documentElement.lang = language;
  for (const item of document.querySelectorAll<HTMLElement>('[data-t]'))
    item.textContent = t(language, item.dataset.t!);
  $('state').textContent = t(language, state);
  $('state').dataset.state = state;
  $('error').textContent = t(language, 'invalid');
  $('result').hidden = !result;
  if (!result) return;
  const { summary, har } = result;
  $('count').textContent = String(har.log.entries.length).padStart(2, '0');
  $('hosts').textContent = String(summary.hosts).padStart(2, '0');
  $('fields').textContent = `${summary.inputFields} → ${summary.outputFields}`;
  $('removed').replaceChildren(
    ...(['headers', 'cookies', 'bodies', 'queries'] as const).map((k) =>
      node('span', `${summary[k === 'queries' ? 'queryPairs' : k]} ${t(language, k)}`),
    ),
  );
  $('rows').replaceChildren();
  const total = extent(result);
  for (const e of har.log.entries.slice(page * 50, page * 50 + 50)) {
    const tr = node('tr', ''),
      request = node('td', `${e.request.method} ${e.request.url}`);
    request.append(node('small', e.response.content.mimeType));
    const td = node('td', ''),
      ns = 'http://www.w3.org/2000/svg',
      svg = document.createElementNS(ns, 'svg'),
      rect = document.createElementNS(ns, 'rect'),
      shape = bar(e, total);
    svg.setAttribute('viewBox', '0 0 300 18');
    svg.setAttribute('aria-hidden', 'true');
    for (const [key, value] of Object.entries({
      x: shape.x,
      y: 2,
      width: shape.width,
      height: 14,
      fill: e.response.status >= 400 ? '#b94f34' : '#577567',
    }))
      rect.setAttribute(key, String(value));
    svg.append(rect);
    td.append(svg, node('small', `${relative(e)} ms + ${Math.round(e.time * 100) / 100} ms`));
    tr.append(
      request,
      node('td', String(e.response.status)),
      node('td', `${e.response.content.size} B`),
      td,
    );
    $('rows').append(tr);
  }
  $('page').textContent = `${page + 1} / ${Math.ceil(har.log.entries.length / 50)}`;
  $<HTMLButtonElement>('previous').disabled = page === 0;
  $<HTMLButtonElement>('next').disabled = (page + 1) * 50 >= har.log.entries.length;
}
function clear() {
  worker?.terminate();
  worker = null;
  clearTimeout(timer);
  result = null;
  page = 0;
  state = 'idle';
  $('error').hidden = true;
  $<HTMLInputElement>('file').value = '';
  $('rows').replaceChildren();
  render();
}
function processFile(file: Blob) {
  clear();
  if (file.size > MAX_BYTES) {
    $('error').hidden = false;
    render();
    return;
  }
  state = 'busy';
  render();
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const current = worker;
  const fail = () => {
    if (worker !== current) return;
    worker.terminate();
    worker = null;
    clearTimeout(timer);
    state = 'idle';
    $('error').hidden = false;
    render();
  };
  timer = setTimeout(fail, 10000);
  worker.onerror = (event) => {
    event.preventDefault();
    fail();
  };
  worker.onmessage = (event) => {
    if (worker !== current) return;
    if (!event.data?.ok) {
      fail();
      return;
    }
    result = event.data.result;
    worker.terminate();
    worker = null;
    clearTimeout(timer);
    state = 'ready';
    render();
  };
  worker.postMessage(file);
}
function download(contents: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('choose').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', () => {
  const file = $<HTMLInputElement>('file').files?.[0];
  if (file) processFile(file);
});
$('sample').addEventListener('click', () =>
  processFile(new Blob([sample()], { type: 'application/json' })),
);
$('drop').addEventListener('dragover', (event) => event.preventDefault());
$('drop').addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  if (file) processFile(file);
});
$('language').addEventListener('change', () => {
  language = $<HTMLSelectElement>('language').value as Language;
  render();
});
$('clear').addEventListener('click', clear);
$('previous').addEventListener('click', () => {
  page = Math.max(0, page - 1);
  render();
});
$('next').addEventListener('click', () => {
  if (result && (page + 1) * 50 < result.har.log.entries.length) page++;
  render();
});
$('download').addEventListener('click', () => {
  if (result)
    download(
      JSON.stringify(result.har, null, 2) + '\n',
      'har-share-minimized.har',
      'application/json',
    );
});
$('report').addEventListener('click', async () => {
  if (!result) return;
  const value = result;
  try {
    const html = await makeHtml(value, language);
    if (result === value) download(html, 'har-share-report.html', 'text/html');
  } catch {
    $('error').hidden = false;
    render();
  }
});
render();

export const MAX_BYTES = 10 * 1024 * 1024,
  MAX_ENTRIES = 2000;
const base = Date.UTC(2000, 0, 1),
  week = 7 * 86400000;
const methods = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'CONNECT',
  'TRACE',
]);
const mimes = new Set([
  'text/html',
  'text/css',
  'text/plain',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'text/xml',
  'application/pdf',
  'application/octet-stream',
  'application/wasm',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/x-icon',
  'font/woff',
  'font/woff2',
  'audio/mpeg',
  'video/mp4',
]);
function obj(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid');
  return value as Record<string, unknown>;
}
function num(value: unknown, min = 0, max = 1e12) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error('invalid');
  return value;
}
function list(value: unknown) {
  if (!Array.isArray(value)) throw new Error('invalid');
  return value;
}
function fieldCount(value: unknown) {
  const stack: unknown[] = [value];
  let count = 0,
    visited = 0;
  while (stack.length) {
    if (++visited > 400000) throw new Error('invalid');
    const item = stack.pop();
    if (item && typeof item === 'object') {
      if (Array.isArray(item)) {
        for (const child of item) stack.push(child);
      } else
        for (const [, v] of Object.entries(item)) {
          count++;
          if (count > 200000) throw new Error('invalid');
          stack.push(v);
        }
    }
  }
  return count;
}
export interface SafeEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    cookies: never[];
    headers: never[];
    queryString: never[];
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    cookies: never[];
    headers: never[];
    content: { size: number; mimeType: string };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: Record<string, number>;
}
export interface Result {
  har: {
    log: { version: string; creator: { name: string; version: string }; entries: SafeEntry[] };
  };
  summary: {
    inputFields: number;
    outputFields: number;
    headers: number;
    cookies: number;
    bodies: number;
    queryPairs: number;
    hosts: number;
    paths: number;
  };
}
export function minimize(source: string): Result {
  try {
    if (new TextEncoder().encode(source).length > MAX_BYTES) throw new Error();
    const raw: unknown = JSON.parse(source.replace(/^\uFEFF/, '')),
      root = obj(raw),
      log = obj(root.log),
      entries = list(log.entries);
    if (log.version !== '1.2' || entries.length < 1 || entries.length > MAX_ENTRIES)
      throw new Error();
    const inputFields = fieldCount(raw),
      hosts = new Map<string, string>(),
      paths = new Map<string, string>();
    let headers = 0,
      cookies = 0,
      bodies = 0,
      queryPairs = 0;
    const starts = entries.map((e) => {
      const raw = obj(e).startedDateTime;
      if (
        typeof raw !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(raw)
      )
        throw new Error();
      const date = Date.parse(raw);
      if (!Number.isFinite(date)) throw new Error();
      return date;
    });
    const first = Math.min(...starts);
    if (Math.max(...starts) - first > week) throw new Error();
    const clean: SafeEntry[] = entries.map((entry, index) => {
      const e = obj(entry),
        request = obj(e.request),
        response = obj(e.response),
        content = obj(response.content),
        timing = obj(e.timings);
      if (
        typeof request.url !== 'string' ||
        request.url.length > 32768 ||
        typeof request.method !== 'string' ||
        typeof content.mimeType !== 'string'
      )
        throw new Error();
      const url = new URL(request.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      if (!hosts.has(url.origin)) hosts.set(url.origin, `host-${hosts.size + 1}.example.invalid`);
      const pathKey = url.origin + '\0' + url.pathname;
      if (!paths.has(pathKey))
        paths.set(pathKey, `/resource-${String(paths.size + 1).padStart(3, '0')}`);
      headers += list(request.headers).length + list(response.headers).length;
      cookies += list(request.cookies).length + list(response.cookies).length;
      queryPairs += Math.max(list(request.queryString).length, [...url.searchParams].length);
      if (request.postData !== undefined) bodies++;
      if (content.text !== undefined) bodies++;
      const timings: Record<string, number> = {
        send: num(timing.send, 0, 86400000),
        wait: num(timing.wait, 0, 86400000),
        receive: num(timing.receive, 0, 86400000),
      };
      for (const key of ['blocked', 'dns', 'connect', 'ssl'])
        if (timing[key] !== undefined) {
          const value = num(timing[key], -1, 86400000);
          if (value < 0 && value !== -1) throw new Error();
          timings[key] = value;
        }
      if ((timings.ssl ?? -1) > Math.max(timings.connect ?? -1, 0)) throw new Error();
      num(e.time, 0, 86400000);
      const time = Object.entries(timings).reduce(
        (sum, [k, v]) => sum + (k !== 'ssl' && v > 0 ? v : 0),
        0,
      );
      if (time > 86400000) throw new Error();
      const status = num(response.status, 0, 599);
      if (!Number.isInteger(status)) throw new Error();
      const size = num(content.size),
        bodySize = num(response.bodySize, -1);
      if (
        !Number.isInteger(size) ||
        !Number.isInteger(bodySize) ||
        (bodySize < 0 && bodySize !== -1)
      )
        throw new Error();
      const mime = content.mimeType.split(';')[0].trim().toLowerCase();
      return {
        startedDateTime: new Date(base + starts[index] - first).toISOString(),
        time,
        request: {
          method: methods.has(request.method) ? request.method : 'OTHER',
          url: `https://${hosts.get(url.origin)}${paths.get(pathKey)}`,
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: [],
          queryString: [],
          headersSize: -1,
          bodySize: -1,
        },
        response: {
          status,
          statusText: '',
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: [],
          content: { size, mimeType: mimes.has(mime) ? mime : 'application/octet-stream' },
          redirectURL: '',
          headersSize: -1,
          bodySize,
        },
        cache: {},
        timings,
      };
    });
    const har = {
      log: { version: '1.2', creator: { name: 'HAR Share', version: '0.1.0' }, entries: clean },
    };
    return {
      har,
      summary: {
        inputFields,
        outputFields: fieldCount(har),
        headers,
        cookies,
        bodies,
        queryPairs,
        hosts: hosts.size,
        paths: paths.size,
      },
    };
  } catch {
    throw new Error('invalid');
  }
}
export function relative(entry: SafeEntry) {
  return Date.parse(entry.startedDateTime) - base;
}

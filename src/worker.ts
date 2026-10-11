import { minimize, MAX_BYTES } from './core.ts';
self.onmessage = async (event: MessageEvent<Blob>) => {
  try {
    if (!(event.data instanceof Blob) || event.data.size > MAX_BYTES) throw new Error();
    const bytes = await event.data.arrayBuffer();
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    self.postMessage({ ok: true, result: minimize(text) });
  } catch {
    self.postMessage({ ok: false });
  }
};

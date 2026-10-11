// Synthetic canaries only. Never replace this fixture with a real network capture.
export function sample() {
  const seed = 'FICTIONAL_CANARY';
  return JSON.stringify({
    log: {
      version: '1.2',
      creator: { name: seed, version: seed },
      pages: [{ title: seed }],
      _private: seed,
      entries: Array.from({ length: 8 }, (_, i) => ({
        startedDateTime: new Date(
          Date.UTC(2026, 0, 2) + [0, 35, 80, 100, 160, 240, 260, 400][i],
        ).toISOString(),
        time: [120, 80, 400, 160, 60, 210, 130, 320][i],
        request: {
          method: i === 4 ? 'POST' : 'GET',
          url: `https://${i < 6 ? 'studio' : 'assets'}.example.invalid/${i === 7 ? 'image-private' : i === 6 ? 'image-private' : `private-${i}`}?token=${seed}#${seed}`,
          httpVersion: 'h2',
          headers: [
            { name: 'Authorization', value: seed },
            { name: 'Cookie', value: seed },
          ],
          cookies: [{ name: seed, value: seed }],
          queryString: [{ name: 'token', value: seed }],
          postData: { mimeType: 'application/json', text: seed },
          headersSize: 100,
          bodySize: 30,
        },
        response: {
          status: i === 4 ? 503 : 200,
          statusText: seed,
          httpVersion: 'h2',
          headers: [{ name: 'Set-Cookie', value: seed }],
          cookies: [{ name: seed, value: seed }],
          content: {
            size: 200 + i * 4096,
            mimeType: i > 5 ? 'image/png' : 'application/json',
            text: seed,
            encoding: 'base64',
          },
          redirectURL: `https://${seed}.invalid`,
          headersSize: 80,
          bodySize: 200 + i * 1024,
        },
        cache: { _private: seed },
        timings: {
          send: 5,
          wait: [100, 60, 380, 140, 40, 190, 110, 300][i],
          receive: 15,
          dns: -1,
          connect: -1,
          ssl: -1,
        },
        serverIPAddress: '192.0.2.123',
        _private: seed,
      })),
    },
  });
}

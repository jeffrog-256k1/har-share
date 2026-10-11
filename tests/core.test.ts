import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { minimize, MAX_BYTES, relative } from '../src/core.ts';
import { sample } from '../src/sample.ts';
import { makeHtml } from '../src/report.ts';
const require = createRequire(import.meta.url),
  Ajv = require('ajv'),
  addFormats = require('ajv-formats'),
  schemas = require('har-schema');
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addMetaSchema(require('ajv/dist/refs/json-schema-draft-06.json'));
ajv.addSchema(Object.values(schemas));
test('strict new HAR has no canaries, bodies, query values, or source metadata', async () => {
  const result = minimize(sample()),
    output = JSON.stringify(result),
    html = await makeHtml(result, 'en');
  for (const marker of [
    'FICTIONAL_CANARY',
    'studio.example.invalid',
    'assets.example.invalid',
    'private-',
    'image-private',
    '2026-01-02',
    '192.0.2.123',
    'Authorization',
    'Set-Cookie',
    'base64',
  ]) {
    assert.ok(!output.includes(marker), marker);
    assert.ok(!html.includes(marker), marker);
  }
  assert.equal(result.har.log.entries.length, 8);
  assert.equal(result.summary.hosts, 2);
  assert.equal(result.summary.paths, 7);
  assert.equal(result.summary.headers, 24);
  assert.equal(result.summary.cookies, 16);
  assert.equal(result.summary.bodies, 16);
  assert.equal(result.summary.queryPairs, 8);
  assert.equal(result.har.log.entries[6].request.url, result.har.log.entries[7].request.url);
  assert.equal(relative(result.har.log.entries[0]), 0);
  assert.equal(relative(result.har.log.entries[7]), 400);
  for (const e of result.har.log.entries) {
    assert.deepEqual(e.request.headers, []);
    assert.deepEqual(e.response.headers, []);
    assert.deepEqual(e.request.queryString, []);
    assert.ok(!('postData' in e.request));
    assert.ok(!('text' in e.response.content));
    assert.equal(e.response.statusText, '');
  }
});
test('output validates against independent HAR 1.2 schemas', () => {
  const result = minimize(sample());
  const validate = ajv.getSchema('har.json') ?? ajv.compile(schemas.har);
  assert.ok(validate(result.har), JSON.stringify(validate.errors));
});
test('unknown strings cannot pass through method, MIME, or extension fields', () => {
  const raw = JSON.parse(sample());
  const e = raw.log.entries[0];
  e.request.method = 'CANARY-METHOD';
  e.response.content.mimeType = 'application/vnd.CANARY+json';
  e._custom = { value: 'CANARY-EXT' };
  const encoded = Buffer.from('CANARY-BASE64-CONTENT').toString('base64');
  e.response.content.text = encoded;
  e.response.content.encoding = 'base64';
  e.request.url =
    'https://user:CANARY-PASS@private.invalid/CANARY-PATH?CANARY-KEY=CANARY-VALUE#CANARY-FRAGMENT';
  const result = minimize(JSON.stringify(raw));
  assert.doesNotMatch(JSON.stringify(result), /CANARY|private\.invalid/);
  assert.ok(!JSON.stringify(result).includes(encoded));
  assert.equal(result.har.log.entries[0].request.method, 'OTHER');
  assert.equal(result.har.log.entries[0].response.content.mimeType, 'application/octet-stream');
});
test('unsupported structures, unsafe numeric values, schemes, limits fail closed', () => {
  for (const mutate of [
    (r: any) => (r.log.version = '1.1'),
    (r: any) => (r.log.entries = []),
    (r: any) => (r.log.entries[0].request.url = 'data:text/plain,CANARY'),
    (r: any) => (r.log.entries[0].response.status = 'CANARY'),
    (r: any) => (r.log.entries[0].response.content.size = 1.2),
    (r: any) => (r.log.entries[0].timings.send = -1),
    (r: any) => (r.log.entries[0].startedDateTime = 'CANARY'),
    (r: any) => (r.log.entries[0].startedDateTime = '2000-01-01T00:00:00Z'),
    (r: any) => (r.log.entries[0].request.headers = null),
  ]) {
    const raw = JSON.parse(sample());
    mutate(raw);
    assert.throws(() => minimize(JSON.stringify(raw)), /^Error: invalid$/);
  }
  assert.throws(() => minimize('CANARY_INVALID_JSON'), /^Error: invalid$/);
  assert.throws(() => minimize(' '.repeat(MAX_BYTES + 1)), /^Error: invalid$/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readEchoEvents } from '../src/lib/echo-stream.ts';

test('SSE preserves split UTF-8, CRLF, multiline data and final frame', async () => {
  const bytes = new TextEncoder().encode('event: text\r\ndata: 共鸣\r\ndata: 继续\r\n\r\nevent: done\ndata: {}');
  const body = new ReadableStream({ start(c) { for (const byte of bytes) c.enqueue(Uint8Array.of(byte)); c.close(); } });
  const events = [];
  for await (const event of readEchoEvents(body)) events.push(event);
  assert.deepEqual(events, [{ event: 'text', data: '共鸣\n继续' }, { event: 'done', data: '{}' }]);
  assert.equal(body.locked, false);
});

test('stopping consumption cancels and releases the stream', async () => {
  let cancelled = false;
  const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('event: error\ndata: {}\n\n')); }, cancel() { cancelled = true; } });
  for await (const event of readEchoEvents(body)) { assert.equal(event.event, 'error'); break; }
  assert.equal(cancelled, true);
  assert.equal(body.locked, false);
});

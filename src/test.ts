import { trace } from './index.js';
import assert from 'node:assert';

async function testBasicTracing() {
  console.log('Testing basic tracing...');
  await trace.startSpan('root', async () => {
    trace.tag('test', 'basic');
    await trace.startSpan('child', async () => {
      await new Promise(r => setTimeout(r, 10));
    });
  });

  const data = trace.toJSON();
  assert.strictEqual(data.rootSpan?.label, 'root');
  assert.strictEqual(data.rootSpan?.children.length, 1);
  assert.strictEqual(data.rootSpan?.children[0]?.label, 'child');
  assert.strictEqual(data.rootSpan?.tags['test'], 'basic');
  console.log('✅ Basic tracing passed');
}

async function testErrorCapturing() {
  console.log('Testing error capturing...');
  try {
    await trace.startSpan('error-parent', async () => {
      throw new Error('boom');
    });
  } catch (e) {}

  const data = trace.toJSON();
  assert.strictEqual(data.rootSpan?.label, 'error-parent');
  assert.strictEqual(data.rootSpan?.error?.message, 'boom');
  console.log('✅ Error capturing passed');
}

async function testSampling() {
  console.log('Testing sampling...');
  trace.configure({ samplingRate: 0 });
  await trace.startSpan('not-sampled', () => {});
  assert.strictEqual(trace.format(), '\u001b[33m⚠ Trace not sampled.\u001b[39m');
  
  trace.configure({ samplingRate: 1 });
  await trace.startSpan('sampled', () => {});
  assert.notStrictEqual(trace.format(), '\u001b[33m⚠ Trace not sampled.\u001b[39m');
  console.log('✅ Sampling passed');
}

async function runTests() {
  try {
    await testBasicTracing();
    await testErrorCapturing();
    await testSampling();
    console.log('\nAll tests passed! 🚀');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
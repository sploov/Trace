import { trace } from './index.js';

async function simulate() {
  await trace.startSpan('root-request', async () => {
    trace.tag('api_version', 'v1');
    
    await trace.startSpan('authentication', async () => {
      await new Promise(r => setTimeout(r, 20));
      trace.tag('user_id', 'user_123');
    });

    await Promise.all([
      trace.startSpan('fetch-db', async () => {
        await new Promise(r => setTimeout(r, 60));
        trace.tag('db.query', 'SELECT * FROM users');
      }),
      trace.startSpan('fetch-cache', async () => {
        await new Promise(r => setTimeout(r, 15));
      })
    ]);

    try {
      await trace.startSpan('legacy-service', async () => {
        await new Promise(r => setTimeout(r, 10));
        throw new Error('Service Unavailable');
      });
    } catch (e) {
      // handled
    }

    await trace.startSpan('serialization', async () => {
      await new Promise(r => setTimeout(r, 5));
    });

    console.log(trace.format());
  });
}

simulate();

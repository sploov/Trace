# 🔍 Trace

[![npm version](https://img.shields.io/npm/v/@sploov/trace.svg?style=flat-square)](https://www.npmjs.com/package/@sploov/trace)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

> **Execution flow, made visible.**

Trace is a lightweight, high-performance tracing and flow-visualization library for Node.js. Designed for developers who need to understand exactly what happens inside their async operations without the overhead of a full APM.

---

## ✨ Features

- 🚀 **Zero-Overhead Async Tracking**: Leverages `AsyncLocalStorage` for bulletproof context propagation.
- 🎨 **Visual Timelines**: Beautiful, colorized CLI output showing parallel and sequential execution.
- 🌲 **Nested Spans**: Effortlessly track parent-child relationships across complex async flows.
- 🛠 **Dev-Friendly**: Capture errors, add tags, and wrap functions with minimal boilerplate.
- 🔌 **Framework Ready**: First-class support for Express.js and easy integration for others.
- 💾 **Persistence**: Export traces to JSON/NDJSON and reload them for offline analysis.
- 🧩 **Extensible**: Hooks for custom exporters, metrics, and plugin support.

---

## 📦 Installation

```bash
npm install @sploov/trace
```

---

## 🚀 Quick Start

```typescript
import { trace } from '@sploov/trace';

async function performTask() {
  await trace.startSpan('compute-data', async () => {
    trace.tag('id', '12345');
    
    // Simulate some work
    await new Promise(r => setTimeout(r, 100));
    
    console.log(trace.format());
  });
}
```

### The Output

Trace transforms complex async logs into an intuitive timeline:

```text
  ● Trace ID: 87c2940c
  ● Duration: 105ms
  ● Spans:    1

  Timeline                                  Execution Flow
  ┌────────────────────────────────────────┐
  │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ compute-data 105ms [id:12345]
  └────────────────────────────────────────┘
```

---

## 🛠 Advanced Usage

### Function Wrapping
Don't want to change your function body? Wrap it!

```typescript
const processUser = trace.wrap('process-user', (user) => {
  // Automatically traced!
});
```

### Express Integration
Track entire request lifecycles with one line of code.

```typescript
import { expressTrace } from '@sploov/trace/middleware';

app.use(expressTrace);
```

### Automatic Error Capture
Trace automatically catches errors and labels them in the timeline.

```typescript
await trace.startSpan('risky-operation', async () => {
  throw new Error('Something went wrong');
});
```

---

## ⚙️ Configuration

Tune Trace to fit your production needs:

```typescript
trace.configure({
  enabled: true,         // Toggle tracing globally
  samplingRate: 0.05,    // Only trace 5% of requests
  maxSpans: 1000         // Protect memory in massive operations
});
```

---

## 🤝 Contributing

We love contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📄 License

Trace is [MIT Licensed](LICENSE).

---

<p align="center">
  Built with ❤️ for the developer community.
</p>

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { writeFile, readFile } from 'node:fs/promises';
import type { SpanData, TraceData, TraceConfig, TracePlugin } from '../types.js';
import { Formatter } from '../ui/Formatter.js';

export class TraceContext {
  private storage = new AsyncLocalStorage<SpanData>();
  private rootSpan: SpanData | null = null;
  private traceId: string = randomUUID().substring(0, 8);
  private config: Required<TraceConfig> = {
    enabled: process.env['TRACE_ENABLED'] !== 'false',
    samplingRate: 1.0,
    maxSpans: 1000
  };
  private spanCount = 0;
  private isSampled = true;
  private plugins: TracePlugin[] = [];

  configure(config: TraceConfig) {
    this.config = { ...this.config, ...config };
  }

  use(plugin: TracePlugin) {
    this.plugins.push(plugin);
  }

  startSpan<T>(label: string, fn: (span: SpanData) => T): T {
    if (!this.config.enabled) return fn({} as any);

    const parentSpan = this.storage.getStore();
    
    if (!parentSpan) {
      this.isSampled = Math.random() < this.config.samplingRate;
      this.spanCount = 0;
      this.rootSpan = null;
      this.traceId = randomUUID().substring(0, 8);
      if (this.isSampled) {
        this.plugins.forEach(p => p.onTraceStart?.(this.traceId));
      }
    }

    if (!this.isSampled) return fn({} as any);
    if (this.spanCount >= this.config.maxSpans) {
      return fn({} as any);
    }

    this.spanCount++;
    const span: SpanData = {
      id: randomUUID().substring(0, 8),
      parentId: parentSpan ? parentSpan.id : null,
      label,
      startTime: Date.now(),
      tags: {},
      children: []
    };

    if (parentSpan) {
      parentSpan.children.push(span);
    } else {
      this.rootSpan = span;
    }

    this.plugins.forEach(p => p.onSpanStart?.(span));

    return this.storage.run(span, () => {
      try {
        const result = fn(span);
        if (result instanceof Promise) {
          return result
            .catch(err => {
              span.error = err;
              throw err;
            })
            .finally(() => this.endSpan(span)) as T;
        }
        this.endSpan(span);
        return result;
      } catch (error) {
        span.error = error;
        this.endSpan(span);
        throw error;
      }
    });
  }

  wrap<Args extends any[], Ret>(label: string, fn: (...args: Args) => Ret): (...args: Args) => Ret {
    return (...args: Args) => this.startSpan(label, () => fn(...args));
  }

  tag(key: string, value: string | number | boolean): void {
    const span = this.storage.getStore();
    if (span) span.tags[key] = value;
  }

  get currentSpan(): SpanData | undefined {
    return this.storage.getStore();
  }

  private endSpan(span: SpanData) {
    if (span.id && span.endTime === undefined) {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
      this.plugins.forEach(p => p.onSpanEnd?.(span));
      
      if (span === this.rootSpan) {
        this.plugins.forEach(p => p.onTraceEnd?.(this.toJSON()));
      }
    }
  }

  toJSON(): TraceData {
    return { 
      id: this.traceId, 
      rootSpan: this.rootSpan, 
      isSampled: this.isSampled,
      spanCount: this.spanCount 
    };
  }

  async save(path: string): Promise<void> {
    await writeFile(path, JSON.stringify(this.toJSON(), null, 2));
  }

  async load(path: string): Promise<void> {
    const data = await readFile(path, 'utf-8');
    const parsed = JSON.parse(data) as TraceData;
    this.traceId = parsed.id;
    this.rootSpan = parsed.rootSpan;
    this.isSampled = parsed.isSampled ?? true;
    this.spanCount = parsed.spanCount ?? 0;
  }

  format(traceData: TraceData = this.toJSON()): string {
    return Formatter.format(traceData);
  }
}

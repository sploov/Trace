export interface SpanData {
  id: string;
  parentId: string | null;
  label: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: any;
  tags: Record<string, string | number | boolean>;
  children: SpanData[];
}

export interface TraceData {
  id: string;
  rootSpan: SpanData | null;
  isSampled: boolean;
  spanCount: number;
}

export interface TraceConfig {
  enabled?: boolean;
  samplingRate?: number;
  maxSpans?: number;
}

export interface TracePlugin {
  onTraceStart?: (id: string) => void;
  onTraceEnd?: (data: TraceData) => void;
  onSpanStart?: (span: SpanData) => void;
  onSpanEnd?: (span: SpanData) => void;
}

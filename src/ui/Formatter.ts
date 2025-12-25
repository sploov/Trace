import pc from 'picocolors';
import type { TraceData, SpanData } from '../types.js';

export class Formatter {
  private static readonly BAR_WIDTH = 40;

  static format(traceData: TraceData): string {
    if (!traceData.isSampled) return pc.yellow('⚠ Trace not sampled.');
    
    const { id, rootSpan, spanCount } = traceData;
    if (!rootSpan) return pc.red('✖ No trace recorded.');
    
    const now = Date.now();
    const totalDuration = (rootSpan.duration || (now - rootSpan.startTime)) || 1;
    const rootStart = rootSpan.startTime;

    let output = `
  ${pc.bold(pc.cyan('●'))} ${pc.bold('Trace ID:')} ${pc.gray(id)}
`;
    output += `  ${pc.bold(pc.cyan('●'))} ${pc.bold('Duration:')} ${pc.blue(`${totalDuration}ms`)}
`;
    output += `  ${pc.bold(pc.cyan('●'))} ${pc.bold('Spans:   ')} ${pc.gray(spanCount.toString())}

`;
    
    const barHeader = ' '.repeat(2) + pc.dim('Timeline') + ' '.repeat(this.BAR_WIDTH - 8 + 2) + pc.dim('Execution Flow') + '\n';
    output += barHeader;
    output += `  ${pc.gray('┌' + '─'.repeat(this.BAR_WIDTH) + '┐')}\n`;
    
    output += this.renderSpan(rootSpan, 0, rootStart, totalDuration);
    
    output += `  ${pc.gray('└' + '─'.repeat(this.BAR_WIDTH) + '┘')}\n`;
    
    return output;
  }

  private static renderSpan(span: SpanData, depth: number, rootStart: number, totalDuration: number): string {
    const now = Date.now();
    const relativeStart = span.startTime - rootStart;
    const duration = span.duration || (now - span.startTime);
    
    const startPos = Math.max(0, Math.floor((relativeStart / totalDuration) * this.BAR_WIDTH));
    let barWidth = Math.max(1, Math.floor((duration / totalDuration) * this.BAR_WIDTH));
    
    // Ensure bar doesn't exceed total width
    if (startPos + barWidth > this.BAR_WIDTH) {
      barWidth = this.BAR_WIDTH - startPos;
    }

    const isError = !!span.error;
    const barColor = isError ? pc.red : (depth === 0 ? pc.cyan : (depth % 2 === 0 ? pc.green : pc.yellow));
    
    const barContent = '━'.repeat(Math.max(0, barWidth));
    const bar = ' '.repeat(startPos) + barColor(barContent);
    const paddedBar = bar.padEnd(this.BAR_WIDTH + (isError ? 10 : 10)); // ANSI compensation

    const indent = depth > 0 ? pc.gray('  '.repeat(depth - 1) + '└─ ') : '';
    const label = isError ? pc.red(pc.bold(span.label)) : (depth === 0 ? pc.bold(pc.white(span.label)) : pc.white(span.label));
    const durationStr = pc.dim(`${duration}ms`);
    
    const tags = Object.keys(span.tags).length 
      ? ` ${pc.dim(`[${Object.entries(span.tags).map(([k, v]) => `${pc.cyan(k)}:${v}`).join(', ')}]`)}` 
      : '';
    
    const errorMsg = span.error ? ` ${pc.bgRed(pc.white(pc.bold(' ERROR ')))} ${pc.red(span.error.message || span.error)}` : '';

    // We need to carefully handle the padding because of ANSI codes
    // Re-calculating visible length for the bar part
    const visibleBar = ' '.repeat(startPos) + '━'.repeat(Math.max(0, barWidth));
    const barPadding = ' '.repeat(this.BAR_WIDTH - visibleBar.length);

    let line = `  ${pc.gray('│')}${bar}${barPadding}${pc.gray('│')} ${indent}${label} ${durationStr}${tags}${errorMsg}\n`;
    
    for (const child of span.children) {
      line += this.renderSpan(child, depth + 1, rootStart, totalDuration);
    }
    return line;
  }
}
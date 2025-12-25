import { TraceContext } from './core/Trace.js';

export * from './types.js';
export * from './core/Trace.js';
export * from './ui/Formatter.js';
export * from './integrations/Express.js';

export const trace = new TraceContext();
export default trace;
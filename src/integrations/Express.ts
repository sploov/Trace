import type { Request, Response, NextFunction } from 'express';
import { trace } from '../index.js';

/**
 * Express middleware for Trace
 */
export function expressTrace(req: Request, res: Response, next: NextFunction) {
  const label = `${req.method} ${req.path}`;
  
  trace.startSpan(label, async () => {
    trace.tag('http.method', req.method);
    trace.tag('http.path', req.path);
    
    const responseFinished = new Promise<void>((resolve) => {
      res.on('finish', () => {
        trace.tag('http.status', res.statusCode);
        resolve();
      });
      res.on('close', resolve);
    });

    next();

    await responseFinished;
  });
}

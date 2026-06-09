import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function ctx(): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ headers: {} }), getResponse: () => ({}) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('bypasses authentication for @Public() routes', () => {
    const reflector = { getAllAndOverride: () => true } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('delegates to passport for protected routes (does not short-circuit to true)', () => {
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    let result: unknown;
    try { result = guard.canActivate(ctx()); } catch { result = 'threw'; }
    // If result is a Promise (async passport path), silence the rejection and verify it's not a plain `true`
    if (result instanceof Promise) { result.catch(() => {}); }
    expect(result).not.toBe(true);
  });
});

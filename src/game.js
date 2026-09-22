import { BASE, ROUTES, cost } from './engine.js';

// Evaluate a player's allocation with exactly the same edge costs as the solver.
export function evaluateAllocation(upper, hybrid = 0, cars = 50, braess = true) {
  if (![upper, hybrid, cars].every(Number.isFinite) || upper < 0 || hybrid < 0 || cars <= 0 || upper + hybrid > cars || (!braess && hybrid > 0)) throw new RangeError('Invalid traffic allocation');
  const flows = { Upper: upper, Lower: cars - upper - hybrid, ...(braess ? { Hybrid: hybrid } : {}) };
  const edgeFlows = { AB: upper + hybrid, BD: upper, AC: flows.Lower, CD: flows.Lower + hybrid, ...(braess ? { BC: hybrid } : {}) };
  const edges = { ...BASE, BC: { t0: .001, cap: 1, alpha: 0, beta: 1 } };
  const times = Object.fromEntries(Object.keys(flows).map(n => [n, ROUTES[n].reduce((s, e) => s + cost(edgeFlows[e], edges[e]), 0)]));
  const total = Object.keys(flows).reduce((s, n) => s + flows[n] * times[n], 0);
  const used = Object.keys(flows).filter(n => flows[n] > .5).map(n => times[n]);
  return { cars, braess, flows, edgeFlows, times, total, average: total / cars, nash: Math.max(...used) - Math.min(...Object.values(times)) < .5 };
}
export function starsFor(average, optimum) {
  const excess = average - optimum;
  return excess <= .1 ? 3 : excess <= 5 ? 2 : excess <= 15 ? 1 : 0;
}

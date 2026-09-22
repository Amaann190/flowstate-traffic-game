// Browser port of game_theory.py. The same BPR costs and MSA assignments
// keep the original course project's numerical model intact.
export const BASE = { AB: { t0: .001, cap: .001, alpha: 1, beta: 1 }, BD: { t0: 45, cap: 1, alpha: 0, beta: 1 }, AC: { t0: 45, cap: 1, alpha: 0, beta: 1 }, CD: { t0: .001, cap: .001, alpha: 1, beta: 1 } };
export const ROUTES = { Upper: ['AB', 'BD'], Lower: ['AC', 'CD'], Hybrid: ['AB', 'BC', 'CD'] };
export const cost = (flow, e) => e.t0 * (1 + e.alpha * (flow / e.cap) ** e.beta);
export function solve(cars, braess = false, mode = 'selfish', customEdges, iterations = 2000) {
  if (!Number.isFinite(cars) || cars < 0) throw new RangeError('Traffic must be a non-negative number');
  const edges = customEdges || { ...BASE, ...(braess ? { BC: { t0: .001, cap: 1, alpha: 0, beta: 1 } } : {}) };
  const names = braess ? ['Upper', 'Lower', 'Hybrid'] : ['Upper', 'Lower'];
  const flows = Object.fromEntries(names.map(n => [n, cars / names.length]));
  const aggregate = () => { const ef = Object.fromEntries(Object.keys(edges).map(e => [e, 0])); names.forEach(n => ROUTES[n].forEach(e => ef[e] += flows[n])); return ef; };
  for (let i = 1; i <= iterations; i++) {
    const ef = aggregate();
    const times = names.map(n => ROUTES[n].reduce((sum, key) => { const e = edges[key]; return sum + cost(ef[key], e) + (mode === 'cooperative' ? e.t0 * e.alpha * e.beta * (ef[key] / e.cap) ** e.beta : 0); }, 0));
    const best = names[times.indexOf(Math.min(...times))];
    names.forEach(n => flows[n] = (1 - 1 / i) * flows[n] + (n === best ? cars / i : 0));
  }
  const edgeFlows = aggregate();
  const times = Object.fromEntries(names.map(n => [n, ROUTES[n].reduce((s, e) => s + cost(edgeFlows[e], edges[e]), 0)]));
  const total = names.reduce((s, n) => s + flows[n] * times[n], 0);
  const used = names.filter(n => flows[n] > .5).map(n => times[n]);
  const nash = !used.length || Math.max(...used) - Math.min(...Object.values(times)) < .5;
  return { flows, edgeFlows, times, total, average: cars ? total / cars : 0, nash, cars, braess, mode };
}
export function scenarios(cars) { return [false, true].flatMap(b => ['selfish', 'cooperative'].map(m => solve(cars, b, m))); }
export function train(cars, braess, episodes, random = Math.random) {
  const q = [[0, 0], [0, 0], [0, 0]], rewards = [];
  const state = f => f < 33 ? 0 : f < 67 ? 1 : 2;
  const baseline = solve(cars, braess);
  const s = state(baseline.edgeFlows.AB);
  const outcomes = [0, 1].map(action => { const key = action === 0 ? 'AB' : 'AC'; const edges = { ...BASE, BC: { t0: .001, cap: 1, alpha: 0, beta: 1 }, [key]: { ...BASE[key], cap: BASE[key].cap * 1.2 } }; if (!braess) delete edges.BC; return solve(cars, braess, 'selfish', edges, 500); });
  for (let i = 0; i < episodes; i++) { const action = random() < .2 ? Math.floor(random() * 2) : q[s][0] >= q[s][1] ? 0 : 1; const result = outcomes[action]; const reward = -result.average; q[s][action] += .1 * (reward + .9 * Math.max(...q[state(result.edgeFlows.AB)]) - q[s][action]); rewards.push(reward); }
  return { q, rewards, cars, braess, episodes };
}

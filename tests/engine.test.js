import test from 'node:test';
import assert from 'node:assert/strict';
import { solve, train } from '../src/engine.js';
test('Baseline: 50 cars split evenly with a 70-minute journey',()=>{const r=solve(50);assert.ok(Math.abs(r.average-70.001)<.001);assert.ok(Math.abs(r.flows.Upper-25)<.01);assert.ok(r.nash);});
test('Braess shortcut raises travel time and cooperation restores it',()=>{const base=solve(50),selfish=solve(50,true),coop=solve(50,true,'cooperative');assert.ok(selfish.average>89.9&&selfish.average<90.1);assert.ok(selfish.average>base.average);assert.ok(Math.abs(coop.average-base.average)<.01);});
test('Flow conservation and optimality across demand range',()=>{for(const cars of [0,10,20,40,50,80,100,150])for(const b of [false,true]){const ue=solve(cars,b),so=solve(cars,b,'cooperative');for(const r of [ue,so]){assert.ok(Math.abs(Object.values(r.flows).reduce((a,b)=>a+b,0)-cars)<1e-6);assert.ok(Object.values(r.flows).every(v=>v>=0));assert.ok(Number.isFinite(r.average));assert.ok(Math.abs(r.edgeFlows.AB+r.edgeFlows.AC-cars)<1e-6);}assert.ok(so.average<=ue.average+.01);}});
test('Shortcut helps at low demand',()=>assert.ok(solve(10,true).average<solve(10).average));
test('Invalid demand rejected',()=>{for(const n of [-1,NaN,Infinity])assert.throws(()=>solve(n),RangeError);});
test('Q-learning produces finite rewards and updates visited state',()=>{let seed=42;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);const r=train(50,true,100,random);assert.equal(r.rewards.length,100);assert.ok(r.rewards.every(v=>Number.isFinite(v)&&v<0));assert.ok(r.q.flat().some(v=>v<0));assert.ok(r.q.flat().every(Number.isFinite));});

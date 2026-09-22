import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAllocation, starsFor } from '../src/game.js';
import { solve } from '../src/engine.js';
test('Player allocations preserve demand and reproduce solver costs',()=>{
  for(let upper=0;upper<=50;upper+=5)for(let hybrid=0;hybrid<=50-upper;hybrid+=5){
    const r=evaluateAllocation(upper,hybrid);
    assert.equal(Object.values(r.flows).reduce((a,b)=>a+b),50);
    assert.equal(r.edgeFlows.AB+r.edgeFlows.AC,50);
    assert.equal(r.edgeFlows.BD+r.edgeFlows.CD,50);
    assert.ok(r.average>=solve(50,true,'cooperative').average-.01);
  }
  assert.ok(Math.abs(evaluateAllocation(5,40).average-solve(50,true).average)<.1);
});
test('Winning allocation earns three stars; shortcut-heavy plans require another attempt',()=>{
  const optimum=solve(50,true,'cooperative').average;
  assert.equal(starsFor(evaluateAllocation(25,0).average,optimum),3);
  assert.equal(starsFor(evaluateAllocation(5,40).average,optimum),0);
  assert.equal(starsFor(optimum+4,optimum),2);
  assert.equal(starsFor(optimum+10,optimum),1);
});
test('Invalid plans cannot lose or invent drivers',()=>{
  for(const args of [[30,30],[-1,0],[NaN,0],[20,-1],[10,1,50,false],[0,0,0]])assert.throws(()=>evaluateAllocation(...args),RangeError);
});

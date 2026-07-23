import { bench } from 'vitest'

// Если ли разница в скорости вызова обычной фукцнии и замороженной.

function fn (value: any) {
  return value
}

function baseFn (value: any) {
  return value
}

baseFn.id = Symbol()
baseFn.another = () => null

interface Frozen {
  (value: any): any
  readonly id: symbol
  readonly another: (() => null)
}

const frozen: Frozen = Object.freeze(baseFn)

const COUNT = 100

bench('fn', () => {
  for (let i = 0; i < COUNT; ++i) {
    if (fn(i)) { /**/ }
  }
})

bench('frozen', () => {
  for (let i = 0; i < COUNT; ++i) {
    if (frozen(i)) { /**/ }
  }
})

/*
 ✓ src/fnVsFreeze.bench.ts 5535ms
     name               hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · fn      15,309,438.94  0.0000  0.0980  0.0001  0.0001  0.0001  0.0002  0.0003  ±0.18%  7654721
   · frozen  16,118,582.78  0.0000  0.1074  0.0001  0.0001  0.0001  0.0001  0.0002  ±0.16%  8059293

 BENCH  Summary

  frozen - src/fnVsFreeze.bench.ts
    1.05x faster than fn
*/

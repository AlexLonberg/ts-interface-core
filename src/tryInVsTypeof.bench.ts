
import { bench } from 'vitest'

// Проверка производительности принадлежности инстанса с безопасным try/catch или классическим typeof.
// try/catch оказался быстрее
// Предположительно сама проверка typeof отнимает много времени, которой нет у try/catch

const MARKER = Symbol.for('GLOBAL_MARKER')
const testIns = {}
function testFn () {
  // ...
}
Object.defineProperty(testIns, MARKER, { value: 'GLOBAL_MARKER' })
Object.defineProperty(testFn, MARKER, { value: 'GLOBAL_MARKER' })

function isInstanceTry (ins: any): boolean {
  try {
    return (MARKER in ins)
  } catch { /**/ }
  return false
}

function isInstanceTypeof (ins: any): boolean {
  return ((typeof ins === 'object') ? ins : (typeof ins === 'function')) ? (MARKER in ins) : false
}

// Меняется между вызовами, поэтому результат нельзя просто вычислить заранее.
const inputs = [testIns, testFn]
let index = 0
let sink = false

bench('isInstanceTry', () => {
  sink = isInstanceTry(inputs[index++ & 1])
})

bench('isInstanceTypeof', () => {
  sink = isInstanceTypeof(inputs[index++ & 1])
})

/*
 ✓ src/tryInVsTypeof.bench.ts 6397ms
     name                         hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · isInstanceTry     19,050,070.00  0.0000  0.3709  0.0001  0.0001  0.0001  0.0002  0.0006  ±0.25%  9525035
   · isInstanceTypeof  17,818,848.00  0.0000  0.1016  0.0001  0.0001  0.0001  0.0001  0.0003  ±0.16%  8909424

  isInstanceTry - src/tryInVsTypeof.bench.ts
    1.07x faster than isInstanceTypeof
*/

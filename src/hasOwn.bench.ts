import { bench } from 'vitest'
import { LIBRARY_ID } from './index.js'

class SomeInterface { }
Object.defineProperty(SomeInterface, LIBRARY_ID, {
  configurable: false,
  enumerable: false,
  writable: false,
  value: Symbol()
})

// Какой из способов проверки наличия собственного свойства объекта самый быстрый

bench('Object.hasOwn', () => {
  for (let i = 0; i < 100; ++i) {
    if (Object.hasOwn(SomeInterface, LIBRARY_ID)) {
      // ...
    }
  }
})

bench('Object.prototype.hasOwnProperty.call', () => {
  for (let i = 0; i < 100; ++i) {
    if (Object.prototype.hasOwnProperty.call(SomeInterface, LIBRARY_ID)) {
      // ...
    }
  }
})

bench('Object.getOwnPropertyDescriptor', () => {
  for (let i = 0; i < 100; ++i) {
    if (Object.getOwnPropertyDescriptor(SomeInterface, LIBRARY_ID)) {
      // ...
    }
  }
})

/*
 ✓ src/hasOwn.bench.ts 2174ms
     name                                          hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · Object.hasOwn                         786,245.06  0.0010  0.4274  0.0013  0.0013  0.0022  0.0028  0.0064  ±0.29%   393123
   · Object.prototype.hasOwnProperty.call  852,218.81  0.0009  0.3733  0.0012  0.0012  0.0020  0.0023  0.0055  ±0.23%   426110
   · Object.getOwnPropertyDescriptor       479,294.08  0.0015  1.3036  0.0021  0.0021  0.0055  0.0075  0.0156  ±0.68%   239648

  Object.prototype.hasOwnProperty.call - src/hasOwn.bench.ts
    1.08x faster than Object.hasOwn
    1.78x faster than Object.getOwnPropertyDescriptor
*/

import { bench } from 'vitest'
import { interfaceDescriptor } from './index.js'
// import { interfaceDescriptor } from '../dist/index.js'

// Native
abstract class NativeFoo {
  abstract readonly name: string
}
abstract class NativeBar extends NativeFoo {
  abstract readonly key: number
}

// Descriptor
interface IFoo {
  readonly name: string
}
const IFoo = interfaceDescriptor()
interface IBar extends IFoo {
  readonly key: number
}
const IBar = interfaceDescriptor(IFoo)

// impl

class NativeClass extends NativeBar {
  readonly name = 'name'
  readonly key: number
  constructor(key: number) {
    super()
    this.key = key
  }
}

class DescriptorClass implements IBar {
  readonly name = 'name'
  readonly key: number
  constructor(key: number) {
    this.key = key
  }
}
IBar.impl(DescriptorClass)

const COUNT = 100

// Создаем массив с РАЗНЫМИ объектами, чтобы V8 не мог
// предсказать структуру и кешировать один ответ
const testObjects = Array.from({ length: COUNT }).map((_, i) => {
  if (i % 3 === 0) return new DescriptorClass(i)
  if (i % 3 === 1) return new NativeClass(i)
  return { random: 'object' }
})

bench('DescriptorClass', () => {
  let matched = 0
  for (let i = 0; i < testObjects.length; ++i) {
    const ins = testObjects[i]
    if (IFoo.is(ins)) { matched++ }
    if (IBar.is(ins)) { matched++ }
    if (ins instanceof DescriptorClass) { matched++ }
  }
  return matched as unknown as void
})

bench('NativeClass', () => {
  let matched = 0
  for (let i = 0; i < testObjects.length; ++i) {
    const ins = testObjects[i]
    if (ins instanceof NativeFoo) { matched++ }
    if (ins instanceof NativeBar) { matched++ }
    if (ins instanceof NativeClass) { matched++ }
  }
  return matched as unknown as void
})

/*
 ✓ src/instanceof.bench.ts 1599ms
     name                       hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DescriptorClass    370,356.74  0.0023  0.1605  0.0027  0.0027  0.0044  0.0048  0.0080  ±0.16%   185179
   · NativeClass      2,092,587.07  0.0004  0.1196  0.0005  0.0005  0.0009  0.0010  0.0014  ±0.15%  1046295

 BENCH  Summary

  NativeClass - src/instanceof.bench.ts
    5.65x faster than DescriptorClass
*/

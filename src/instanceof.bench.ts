import { bench } from 'vitest'
import { interfaceDefineHasInstance, interfaceImplements } from './index.js'

function defineHasInstance (set: WeakSet<Function>, cls: object) {
  if (!Object.getOwnPropertyDescriptor(cls, Symbol.hasInstance)) {
    Object.defineProperty(cls, Symbol.hasInstance, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: (ins: any) => {
        let proto = ins?.constructor
        while (proto) {
          if (set.has(proto)) return true
          proto = Object.getPrototypeOf(proto)
        }
        return false
      }
    })
  }
}

// Native

abstract class NativeFoo {
  abstract readonly name: string
}

abstract class NativeBar extends NativeFoo {
  abstract readonly key: number
}

// WeakSet

const IFooSubclasses = new WeakSet()
abstract class IFoo {
  abstract readonly name: string

  static _implement (cls: abstract new (..._: any[]) => any) {
    IFooSubclasses.add(cls)
  }
}
defineHasInstance(IFooSubclasses, IFoo)

const IBarSubclasses = new WeakSet()
abstract class IBar {
  abstract readonly key: number

  static _implement (cls: abstract new (..._: any[]) => any) {
    IBarSubclasses.add(cls)
  }
}
defineHasInstance(IBarSubclasses, IBar)

// Symbol

abstract class IFooSymbol {
  abstract readonly name: string

  static _implement (cls: abstract new (..._: any[]) => any) {
    interfaceImplements(cls, IFooSymbol)
  }
}
interfaceDefineHasInstance(IFooSymbol)

abstract class IBarSymbol {
  abstract readonly key: number

  static _implement (cls: abstract new (..._: any[]) => any) {
    interfaceImplements(cls, IBarSymbol)
  }
}
interfaceDefineHasInstance(IBarSymbol)

// impl

abstract class NativeClassBase extends NativeBar {
  readonly name = 'NativeSomeBase'
}

abstract class IClassBase implements IFoo {
  readonly name = 'IClassBase'
}
IFoo._implement(IClassBase)

abstract class IClassSymbolBase implements IFooSymbol {
  readonly name = 'IClassSymbolBase'
}
IFooSymbol._implement(IClassSymbolBase)

class NativeClass extends NativeClassBase {
  readonly key: number
  constructor(key: number) {
    super()
    this.key = key
  }
}

class CustomClass extends IClassBase implements IBar {
  readonly key: number
  constructor(key: number) {
    super()
    this.key = key
  }
}
IBar._implement(CustomClass)

class CustomClassSymbol extends IClassSymbolBase implements IBarSymbol {
  readonly key: number
  constructor(key: number) {
    super()
    this.key = key
  }
}
IBarSymbol._implement(CustomClassSymbol)

bench('native if ', () => {
  const ins = new NativeClass(123)
  if (ins instanceof NativeFoo) { /**/ }
  if (ins instanceof NativeBar) { /**/ }
  if (ins instanceof NativeClassBase) { /**/ }
  if (ins instanceof NativeClass) { /**/ }
})

bench('custom if ', () => {
  const ins = new CustomClass(123)
  if (ins instanceof IFoo) { /**/ }
  if (ins instanceof IBar) { /**/ }
  if (ins instanceof IClassBase) { /**/ }
  if (ins instanceof CustomClass) { /**/ }
})

bench('symbol if', () => {
  const ins = new CustomClassSymbol(123)
  if (ins instanceof IFooSymbol) { /**/ }
  if (ins instanceof IBarSymbol) { /**/ }
  if (ins instanceof IClassSymbolBase) { /**/ }
  if (ins instanceof CustomClassSymbol) { /**/ }
})

//  ✓ src/instanceof.bench.ts 8131ms
//      name                   hz     min     max    mean     p75     p99    p995    p999     rme  samples
//    · native if   17,760,134.45  0.0000  0.2010  0.0001  0.0001  0.0002  0.0002  0.0004  ±0.24%  8880069
//    · custom if   12,111,659.58  0.0000  0.4656  0.0001  0.0001  0.0002  0.0003  0.0004  ±0.28%  6055831
//    · symbol if   16,497,972.00  0.0000  0.4827  0.0001  0.0001  0.0001  0.0002  0.0003  ±0.33%  8248986

//  BENCH  Summary

//   native if  - src/instanceof.bench.ts
//     1.08x faster than symbol if
//     1.47x faster than custom if

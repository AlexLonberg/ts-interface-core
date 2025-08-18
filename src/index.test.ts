import { test, expect } from 'vitest'
import {
  INTERFACE_MARKER_PROPERTY,
  interfaceMarker,
  interfaceDefineHasInstanceMarker,
  interfaceDefineHasInstance,
  interfaceImplementMarkers,
  interfaceImplementInterfaces,
  interfaceImplements
} from './index.js'

// Пример интерфейса с явным определением символа.
const FooLikeMarker = Symbol()
abstract class FooLike {
  abstract readonly name: string
}
interfaceDefineHasInstanceMarker(FooLike, FooLikeMarker)

// Интерфейс с автоматической генерацией маркера
abstract class BarLike {
  abstract readonly key: number
}
interfaceDefineHasInstance(BarLike)

// Реализация интерфеса
class SomeBase implements FooLike {
  readonly name = 'SomeBase'
}
interfaceImplements(SomeBase, FooLike)

// Реализация с наследованием и интерфейсом
class SomeBaseImpl extends SomeBase implements BarLike {
  readonly kind = 'SomeBaseImpl'
  readonly key: number
  constructor(key: number) {
    super()
    this.key = key
  }
}
interfaceImplements(SomeBaseImpl, BarLike)

test('default', () => {
  // Простое наследование
  const insFoo = new (class extends FooLike { name = '' })()
  const insBar = new (class extends BarLike { key = 0 })()
  expect(insFoo instanceof FooLike).toBe(true)
  expect(insBar instanceof BarLike).toBe(true)
})

test('SomeBase', () => {
  const ins = new SomeBase()
  expect(ins instanceof FooLike).toBe(true)
  expect(ins instanceof SomeBase).toBe(true)
  expect(ins instanceof BarLike).not.toBe(true)
})

test('SomeBaseImpl', () => {
  const ins = new SomeBaseImpl(123)
  expect(ins instanceof FooLike).toBe(true)
  expect(ins instanceof BarLike).toBe(true)
  expect(ins instanceof SomeBase).toBe(true)
  expect(ins instanceof SomeBaseImpl).toBe(true)
})

test('Множественная реализация', () => {
  class Foo implements FooLike, BarLike {
    key = 123
    name = 'Foo'
  }
  interfaceImplements(Foo, FooLike, BarLike)

  const ins = new Foo()
  expect(ins instanceof FooLike).toBe(true)
  expect(ins instanceof BarLike).toBe(true)
  expect(ins instanceof Foo).toBe(true)
})

test('Наследование и реализация', () => {
  class Foo extends FooLike implements BarLike {
    key = 123
    name = 'Foo'
  }
  interfaceImplements(Foo, BarLike)

  const ins = new Foo()
  expect(ins instanceof FooLike).toBe(true)
  expect(ins instanceof BarLike).toBe(true)
  expect(ins instanceof Foo).toBe(true)
})

test('Слияние интерфейсов', () => {
  abstract class FooBarLike extends FooLike implements BarLike {
    // Для слияния в новый интерфейс придется скопировать свойство
    abstract readonly key: number
    abstract readonly kind: string
  }
  // Одновременно определяем новый интерфейс и наследуем
  interfaceDefineHasInstance(FooBarLike)
  interfaceImplements(FooBarLike, BarLike)

  class Impl extends FooBarLike {
    readonly key = 123
    readonly name = 'Impl'
    readonly kind = 'FooBarLike'
  }

  // Все интерфейсы автоматически реализованы
  const ins = new Impl()

  expect(ins instanceof FooLike).toBe(true)
  expect(ins instanceof BarLike).toBe(true)
  expect(ins instanceof FooBarLike).toBe(true)
  expect(ins instanceof Impl).toBe(true)
})

test('Определение дружелюбного объекта', () => {
  interface ILike extends FooLike, BarLike {
    kind: string
  }

  // Реализация объекта
  const ins: ILike = interfaceImplementInterfaces({
    name: 'ILike',
    key: 123,
    kind: 'FooBar'
  }, FooLike, BarLike)

  expect(ins instanceof FooLike).toBe(true)
  expect(ins instanceof BarLike).toBe(true)
})

test('Ошибка двойного определения интерфейса', () => {
  const marker = Symbol()
  class Proto { }

  // Автоматически установим маркер интерфейса
  interfaceDefineHasInstance(Proto)

  // Повторная попытка установить другой маркер вызовет исключение
  expect(() => interfaceDefineHasInstanceMarker(Proto, marker)).toThrowError(Error)

  // Это не вызовет исключения, но и не установит новый маркер, который уже определен
  const real = interfaceMarker(Proto)!
  interfaceDefineHasInstanceMarker(Proto, real)
  expect((Proto as any)[INTERFACE_MARKER_PROPERTY]).toBe(real)
})

test('Быстрая реализация простых объектов', () => {
  // Для часто создаваемых объектов реализующих интерфейс,
  // достаньте марке и используйте любой из методов определения свойства
  const marker1 = interfaceMarker(FooLike)!
  const marker2 = interfaceMarker(BarLike)!

  const ins = interfaceImplementMarkers({ name: '', key: 0 }, marker1, marker2)
  const customFoo = Object.defineProperties({}, {
    // По умолчанию значение маркера null, но значение не играет роли и его можно использовать на свое усмотрение
    [marker1]: { value: 'Foo Like' },
    name: { value: 'customFoo' }
  })

  expect(ins instanceof FooLike).toBe(true)
  expect(ins instanceof BarLike).toBe(true)
  expect(customFoo instanceof FooLike).toBe(true)
  expect(customFoo instanceof BarLike).not.toBe(true)
})

test('Детектирование класса-интерфейса', () => {
  class Foo { }
  class Bar implements Foo { }
  interfaceDefineHasInstance(Foo)
  interfaceImplements(Bar, Foo)

  const foo = new Foo()
  const bar = new Bar()
  expect(foo instanceof Foo).toBe(true)
  expect(bar instanceof Foo).toBe(true)

  // Класс интерфейс установит значением в свойство-маркер - сам маркер.
  // Наследники могут использовать это свойство {[marker(Symbol)]:any} на свое усмотрение(по умолчанию null).
  const isFooInterface = (value: object) => {
    const marker = interfaceMarker(Foo)!
    return (value as any)[marker] === marker
  }
  expect(isFooInterface(foo)).toBe(true)
  expect(isFooInterface(bar)).toBe(false)
})

test('Невалидные типы', () => {
  class Foo { }
  const value: any = null

  expect(value instanceof Foo).toBe(false)
  expect(value instanceof FooLike).toBe(false)

  // Класс интерфейса обязательно должен маркировать себя перед использованием
  expect(interfaceMarker(Foo)).toBe(null)
  expect(() => interfaceImplementInterfaces({}, Foo)).toThrowError(Error)
  expect(() => interfaceImplements(class Bar { }, Foo)).toThrowError(Error)
})

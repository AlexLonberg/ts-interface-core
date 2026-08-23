import { describe, test, expect } from 'vitest'
import {
  // LIBRARY_ID,
  // type TClass,
  type InterfaceDescriptor,
  // type InterfaceDescriptorFactory,
  interfaceDescriptor
} from './index.ts'

interface IFoo {
  readonly foo: boolean
}
// Создаем пересечение дескриптора и интерфейса
const IFoo = interfaceDescriptor<IFoo>()

interface IBar extends IFoo {
  readonly bar: number
}
// Расширяем интерфейс путем передачи предка
const IBar = interfaceDescriptor<IBar>(IFoo)

interface IDisposable {
  dispose (): void
}
const IDisposable = interfaceDescriptor<IDisposable>()

interface ISomething<T extends string> extends IBar, IDisposable {
  readonly box: T
}
// IBar автоматически реализует своих предков.
// Интерфейсы с дженериками и ограничениями - придется подавить <any>
// Тип интерфейса определяется:
//  + В дженерике фукцнии interfaceDescriptor
//  + С помощью импортированного InterfaceDescriptor
//  + Или того же типа InterfaceDescriptor на самой функции в сокращенном вариенте I
const ISomething: InterfaceDescriptor<ISomething<any>> = interfaceDescriptor(IBar, IDisposable)

describe('ts-interface-core interface_new_v010e', () => {
  test('interfaceDescriptor', () => {

    class Something implements ISomething<'hello' | 'world'> {
      foo: boolean = true
      bar: number = 123
      box: 'hello' | 'world'
      private _disposed = false

      constructor(box: 'hello' | 'world') {
        this.box = box
      }

      get disposed (): boolean {
        return this._disposed
      }

      dispose (): void {
        this._disposed = true
      }
    }

    const ins = new Something('hello')

    // Сужение типа
    let foo: boolean
    let bar: number
    let box: string
    let dispose: () => void
    const fake = {} as unknown
    if (IFoo.is(fake)) {
      foo = fake.foo
      // @ts-expect-error
      bar = fake.bar
      // box = fake.box
      // dispose = fake.dispose
    }
    if (IBar.is(fake)) {
      foo = fake.foo
      bar = fake.bar
      // @ts-expect-error
      box = fake.box
      // dispose = fake.dispose
    }
    if (IDisposable.is(fake)) {
      // @ts-expect-error
      foo = fake.foo
      // bar = fake.bar
      // box = fake.box
      dispose = fake.dispose
    }
    if (ISomething.is(fake)) {
      foo = fake.foo
      bar = fake.bar
      box = fake.box
      dispose = fake.dispose
    }

    // Очевидно, что такое невозможно
    expect(
      // @ts-expect-error
      () => ins instanceof ISomething
    ).toThrow()

    // Нативно работает только реальный класс
    expect(ins instanceof Something).toBe(true)

    // До применения симуляции
    expect(IFoo.is(ins)).toBe(false)
    expect(IBar.is(ins)).toBe(false)
    expect(IDisposable.is(ins)).toBe(false)
    expect(ISomething.is(ins)).toBe(false)
    // ... После применения
    ISomething.impl(Something)
    expect(IFoo.is(ins)).toBe(true)
    expect(IBar.is(ins)).toBe(true)
    expect(IDisposable.is(ins)).toBe(true)
    expect(ISomething.is(ins)).toBe(true)

    // Любое невалидное значение будет проигнорировано
    expect(IBar.is(undefined)).toBe(false)
    expect(IFoo.is(null)).toBe(false)
    expect(IFoo.is(true)).toBe(false)
    expect(IFoo.is(0)).toBe(false)
    expect(IFoo.is(123)).toBe(false)
    expect(IFoo.is(456n)).toBe(false)
    expect(IFoo.is('...')).toBe(false)
    expect(IFoo.is(() => null)).toBe(false)

    // Расширение класса симулирующего интерфейсы
    class SomeExt extends Something {
      activate (): void { }
    }
    const se = new SomeExt('world')
    expect(IFoo.is(se)).toBe(true)
    expect(IBar.is(se)).toBe(true)
    expect(IDisposable.is(se)).toBe(true)
    expect(ISomething.is(se)).toBe(true)
  })

  test('Симуляция интерфейса для любого типа', () => {
    const cls = class { x = 0 }
    const foo = new class { y = 0 }()
    const bar = {}
    function fun () { }
    const arrowFn = () => { }

    // Определить маркеры можно несколькими способами

    // Классический вариант. Для классов используем функции без суффикса Any.
    // ... функции с суффиксом AndFreeze - замораживают объекты
    ISomething.implAndFreeze(cls)
    // Вариант маркировки инстанса
    ISomething.implAny(foo)

    // Предварительное получение дескрипторов
    const parentDescriptors = ISomething.descriptors
    // Получение дескрипторов из маркированного класса
    const descriptorsOfClass = interfaceDescriptor.descriptorsOf(cls)
    // Получение дескрипторов из объекта
    const descriptorsOfAny = interfaceDescriptor.descriptorsOfAny(foo)

    // У интерфейса может не быть родительских дескрипторов и набор не содержит ссылки на себя - сольем их в один набор.
    interfaceDescriptor.markAny(bar, [ISomething, ...(parentDescriptors ?? [])])
    // Маркировать можно даже функции
    interfaceDescriptor.markAny(fun, descriptorsOfClass)
    interfaceDescriptor.markAnyAndFreeze(arrowFn, descriptorsOfAny)

    // Любой тип теперь симулирует реализацию
    const ins = new cls()
    for (const item of [ins, foo, bar, fun, arrowFn]) {
      expect(IFoo.is(item)).toBe(true)
      expect(IBar.is(item)).toBe(true)
      expect(IDisposable.is(item)).toBe(true)
      expect(ISomething.is(item)).toBe(true)
    }

    // Набор дескрипторов каждого объекта одинаков
    const initial = new Set([IFoo, IBar, IDisposable, ISomething])

    const array = [
      new Set([ISomething, ...(parentDescriptors ?? [])]),
      new Set(descriptorsOfClass),
      new Set(descriptorsOfAny),
      new Set(interfaceDescriptor.descriptorsOfAny(ins)),
      new Set(interfaceDescriptor.descriptorsOfAny(foo)),
      new Set(interfaceDescriptor.descriptorsOfAny(bar)),
      new Set(interfaceDescriptor.descriptorsOfAny(fun)),
      new Set(interfaceDescriptor.descriptorsOfAny(arrowFn))
    ]

    for (const item of array) {
      expect(item.size).toBe(initial.size)
      expect(item).toEqual(initial)
    }
  })
})

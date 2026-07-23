

import { test, expect } from 'vitest'
import {
  type TClass,
  INTERFACE_MARKER_ID,
  INTERFACE_MARKER_PROPERTY,
  interfaceHasInstance,
  interfaceMarker,
  interfaceMarkersOfObject,
  interfaceMarkersOfInstance,
  interfaceMarkersOfClass,
  interfaceDefineHasInstanceMarker,
  // interfaceDefineHasInstanceMarkerAndFreeze,
  interfaceDefineHasInstance,
  // interfaceDefineHasInstanceAndFreeze,
  interfaceDefineMarkers,
  interfaceDefineInterfaces,
  interfaceImplementMarkers,
  interfaceImplements,
  // interfaceImplementsAndFreeze,
  interfaceExtends,
  // interfaceExtendsAndFreeze,
  // interfaceDefineHasInstanceAndImplements,
  // interfaceDefineHasInstanceAndImplementsAndFreeze,
  // interfaceDefineHasInstanceAndExtends,
  // interfaceDefineHasInstanceAndExtendsAndFreeze
} from './index.js'

// Пример интерфейса с явным определением символа.
const FooLikeMarker = Symbol()
abstract class IFoo {
  abstract readonly name: string
}
interfaceDefineHasInstanceMarker(IFoo, FooLikeMarker)

// Интерфейс с автоматической генерацией маркера
abstract class IBar {
  abstract readonly key: number
}
interfaceDefineHasInstance(IBar)

// Реализация интерфеса
class SomeBase implements IFoo {
  readonly name = 'SomeBase'
}
interfaceImplementMarkers(SomeBase, interfaceMarker(IFoo)!)

// Реализация с наследованием и интерфейсом
class SomeBaseImpl extends SomeBase implements IBar {
  readonly kind = 'SomeBaseImpl'
  readonly key: number
  constructor(key: number) {
    super()
    this.key = key
  }
}
interfaceImplements(SomeBaseImpl, IBar)

test('😒 Проблема в с переопределением Symbol.hasInstance', () => {
  // Переопределение символа Symbol.hasInstance и почему пришлось отказаться от этой версии библиотеки и полностью
  // отказаться от нативного instanceof?
  //
  // Первоначально предполагалось что реализации и их нативный Symbol.hasInstance не так часто востребованы и конечному
  // приложению или библиотекам важнее детектировать входящие параметры(интерфейсы). Но на практике все оказалось иначе.
  // Переопределение статического Symbol.hasInstance приводит к наследованию этого метода и собственный Symbol.hasInstance
  // перестает детектировать расширения, а вся цепочка потомков вынуждена перемаркировать себя interfaceDefineHasInstance(SelfClass)

  // ⚠️ В итоге это приводило к такому:
  abstract class IDisposable { abstract dispose (): void }
  interfaceDefineHasInstance(IDisposable)

  let count = 0
  class Foo extends IDisposable { dispose (): void { count++ } }
  class Bar extends IDisposable { dispose (): void { count++ } }
  const foo = new Foo()
  const bar = new Bar()

  // Сервису, ослуживающему уничтожение инстансов нужен был только интерфейс
  if (foo instanceof IDisposable) {
    foo.dispose()
  }
  if (bar instanceof IDisposable) {
    bar.dispose()
  }
  expect(count).toBe(2)
  // ... а приложению нужно было детектировать тип, но нативное расширение extends ломает собственный Symbol.hasInstance
  expect(foo instanceof Foo).toBe(true)
  expect(bar instanceof Foo).toBe(true) // instanceof использует переопределенную реализацию Symbol.hasInstance
  expect(foo instanceof Bar).toBe(true) // ... и фактически проверяет не класс, а маркер IDisposable
  expect(bar instanceof Bar).toBe(true)

  // 🤔 Для правильной работы интерфейсов наследование extends не допускается
  class Box implements IDisposable { dispose (): void { count++ } }
  class Fox implements IDisposable { dispose (): void { count++ } }
  // ... но требует явного маркирования
  interfaceImplements(Box, IDisposable)
  interfaceExtends(Fox, IDisposable) // ... или глубокая маркировка, когда интерфейсы так же унаследованы
  const box = new Box()
  const fox = new Fox()
  if (box instanceof IDisposable) {
    box.dispose()
  }
  if (fox instanceof IDisposable) {
    fox.dispose()
  }
  expect(count).toBe(4)
  expect(box instanceof Box).toBe(true)
  expect(fox instanceof Box).toBe(false) // implements не затронул Symbol.hasInstance и все работает как и ожидалось
  expect(box instanceof Fox).toBe(false) //
  expect(fox instanceof Fox).toBe(true)

  // 📝 Основная проблема использования подхода с классами-интерфесами - человеческий фактор.
  // Абстрактный класс проще расширить через extends и не импортировать утилиту interfaceImplements(), понадеявшись что
  // instanceof не понадобится, ... но практика показала что проверка принадлежности классу - частая и нужна операция.
  //
  // 😐 Решено полностью отказаться от переопределения Symbol.hasInstance в пользу классических интерфейсов и слияния
  // с дескрипторами(константами). Это явно запретит extends и убережет от человеческого фактора.
})

test('default', () => {
  // Простое наследование
  const insFoo = new (class extends IFoo { name = '' })()
  const insBar = new (class extends IBar { key = 0 })()
  expect(insFoo instanceof IFoo).toBe(true)
  expect(insBar instanceof IBar).toBe(true)
})

test('SomeBase', () => {
  const ins = new SomeBase()
  expect(ins instanceof IFoo).toBe(true)
  expect(ins instanceof SomeBase).toBe(true)
  expect(ins instanceof IBar).not.toBe(true)
})

test('SomeBaseImpl', () => {
  const ins = new SomeBaseImpl(123)
  expect(ins instanceof IFoo).toBe(true)
  expect(ins instanceof IBar).toBe(true)
  expect(ins instanceof SomeBase).toBe(true)
  expect(ins instanceof SomeBaseImpl).toBe(true)
})

test('Множественная реализация', () => {
  class Foo implements IFoo, IBar {
    key = 123
    name = 'Foo'
  }
  interfaceImplements(Foo, IFoo, IBar)

  const ins = new Foo()
  expect(ins instanceof IFoo).toBe(true)
  expect(ins instanceof IBar).toBe(true)
  expect(ins instanceof Foo).toBe(true)
})

test('Наследование и реализация', () => {
  class Foo extends IFoo implements IBar {
    key = 123
    name = 'Foo'
  }
  interfaceImplements(Foo, IBar)

  const ins = new Foo()
  expect(ins instanceof IFoo).toBe(true)
  expect(ins instanceof IBar).toBe(true)
  expect(ins instanceof Foo).toBe(true)
})

test('Слияние интерфейсов', () => {
  abstract class IFooBar extends IFoo implements IBar {
    // Для слияния в новый интерфейс придется скопировать свойство из IBar
    abstract readonly key: number
    abstract readonly kind: string
  }
  // Одновременно определяем новый интерфейс и расширяем от implements(который не может передать прототип)
  interfaceDefineHasInstance(IFooBar)
  interfaceImplements(IFooBar, IBar)

  class Impl extends IFooBar {
    readonly key = 123
    readonly name = 'Impl'
    readonly kind = 'FooBarLike'
  }

  // Все интерфейсы автоматически реализованы
  const ins = new Impl()

  expect(ins instanceof IFoo).toBe(true)
  expect(ins instanceof IBar).toBe(true)
  expect(ins instanceof IFooBar).toBe(true)
  expect(ins instanceof Impl).toBe(true)
})

test('Ошибка слияния интерфейсов', () => {
  class BaseInterface { }
  interfaceDefineHasInstance(BaseInterface)
  class OtherBaseInterface { }
  interfaceDefineHasInstance(OtherBaseInterface)

  class ExtendsInterface extends BaseInterface implements OtherBaseInterface { }
  interfaceDefineHasInstance(ExtendsInterface)
  interfaceImplements(ExtendsInterface, OtherBaseInterface)

  class Some implements ExtendsInterface { }
  interfaceImplements(Some, ExtendsInterface)
  const ins = new Some()

  // Реализация расширенного интерфейса не приведет к автоматической реализации базовых интерфейсов
  expect(ins instanceof ExtendsInterface).toBe(true)
  expect(ins instanceof BaseInterface).toBe(false)
  expect(ins instanceof OtherBaseInterface).toBe(false)
  // Требуется реализовать всю цепочку или использовать interfaceExtends()
  interfaceImplements(Some, BaseInterface, OtherBaseInterface)
  const ok = new Some()
  expect(ok instanceof BaseInterface).toBe(true)
  expect(ok instanceof OtherBaseInterface).toBe(true)
})

test('Расширение интерфейсов с автоматическим поиском всех символов', () => {
  class IFoo { }
  interfaceDefineHasInstance(IFoo)
  class IBar { }
  interfaceDefineHasInstance(IBar)
  class ICombined extends IFoo implements IBar { }
  interfaceDefineHasInstance(ICombined)
  interfaceImplements(ICombined, IBar)

  // Реализация.
  class ISome implements ICombined { }
  // Интерфейс ICombined содержит свой маркер, ссылку на прототип IFoo и маркер IBar
  // Такой интерфейс можно реализовать или расширить одной функцией, которая обнаружит все три маркера
  interfaceExtends(ISome, ICombined)
  const some = new ISome()
  expect(some instanceof IFoo).toBe(true)
  expect(some instanceof IBar).toBe(true)
  expect(some instanceof ICombined).toBe(true)

  const markers1 = interfaceMarkersOfObject(some)
  const markers2 = interfaceMarkersOfInstance(some)
  const markers3 = interfaceMarkersOfClass(ISome)
  expect(markers1.size).toBe(3)
  expect([...markers1]).toEqual(expect.arrayContaining([...markers2]))
  expect([...markers1]).toEqual(expect.arrayContaining([...markers3]))
})

test('Определение дружелюбного объекта', () => {
  interface ILike extends IFoo, IBar {
    kind: string
  }

  // Реализация объекта
  const ins: ILike = interfaceDefineInterfaces({
    name: 'ILike',
    key: 123,
    kind: 'FooBar'
  }, IFoo, IBar) // <- передаем классы

  expect(ins instanceof IFoo).toBe(true)
  expect(ins instanceof IBar).toBe(true)
})

test('Ошибка двойного определения интерфейса с разными маркерами', () => {
  const marker = Symbol()
  class Proto { }

  // Автоматически установим маркер интерфейса
  interfaceDefineHasInstance(Proto)

  // Повторная попытка установить другой маркер вызовет исключение - у класса-интерфеса может быть только один маркер
  expect(() => interfaceDefineHasInstanceMarker(Proto, marker)).toThrow('[ts-interface-core] Невозможно переопределить интерфейс с другим маркером.')

  // Собственный маркер не вызывает исключения и проигнорирует повторную установку.
  const real = interfaceMarker(Proto)!
  interfaceDefineHasInstanceMarker(Proto, real)
  expect((Proto as any)[INTERFACE_MARKER_PROPERTY]).toBe(real)
})

test('Ошибка переопределения Symbol.hasInstance', () => {
  // Интерфейсы должны определяют hasInstance и запрещают дальнейшую конфигурацию этого свойства - configurable:false, writable:false

  // Предположим кто-либо уже определил свой hasInstance, даже если свойство перезаписываемо
  class ErrorInterface { }
  Object.defineProperty(ErrorInterface, Symbol.hasInstance, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function (_ins: any) { /**/ }
  })
  // Попытка определить интерфейс завершится ошибкой
  expect(() => interfaceDefineHasInstance(ErrorInterface)).toThrow('[ts-interface-core] Невозможно переопределить hasInstance.')
  // ... такой класс невозможно использовать как интерфейс
  class ErrorInterfaceImpl { }
  expect(() => interfaceImplements(ErrorInterfaceImpl, ErrorInterface)).toThrow('[ts-interface-core] Один из интерфейсов не имеет обязательного маркера.')
})

test('Быстрая реализация простых объектов', () => {
  // Для часто создаваемых объектов реализующих интерфейс,
  // достаньте марке и используйте любой из методов определения свойства
  const marker1 = interfaceMarker(IFoo)!
  const marker2 = interfaceMarker(IBar)!

  const ins = interfaceDefineMarkers({ name: '', key: 0 }, marker1, marker2)
  const customFoo = Object.defineProperties({}, {
    // По умолчанию значение маркера INTERFACE_MARKER_ID, и используется для поиска символов.
    // Но значение не играет роли, для кастомного объекта, и его можно использовать на свое усмотрение
    [marker1]: { value: 'Foo Like' },
    name: { value: 'customFoo' }
  })

  expect(ins instanceof IFoo).toBe(true)
  expect(ins instanceof IBar).toBe(true)
  expect(customFoo instanceof IFoo).toBe(true)
  expect(customFoo instanceof IBar).not.toBe(true)
})

test('Детектирование класса-интерфейса', () => {
  class Foo { }
  interfaceDefineHasInstance(Foo)
  class Bar implements Foo { }
  interfaceImplements(Bar, Foo)

  const foo = new Foo()
  const bar = new Bar()
  expect(foo instanceof Foo).toBe(true)
  expect(bar instanceof Foo).toBe(true)

  // Только классы интерфейсов устанавливаю свойство с уникальным символом на конструкторе. Это свойство можно
  // использовать для идентификации инстанса, который был определен как интерфейс интерфейса
  const isFooInterface = (value: object) => {
    // получаем маркер
    const marker = interfaceMarker(Foo)!
    // проверяем есть ли у конструктора такой же уникальный маркер
    return (value.constructor as any)[INTERFACE_MARKER_PROPERTY] === marker
  }
  expect(isFooInterface(foo)).toBe(true)
  expect(isFooInterface(bar)).toBe(false)
})

test('Невалидные типы', () => {
  class Foo { }
  const value: any = null

  expect(value instanceof Foo).toBe(false)
  expect(value instanceof IFoo).toBe(false)

  // Класс интерфейса обязательно должен маркировать себя перед использованием
  expect(interfaceMarker(Foo)).toBe(null)
  expect(() => interfaceDefineInterfaces({}, Foo)).toThrow('[ts-interface-core] Один из интерфейсов не имеет обязательного маркера.')
  expect(() => interfaceImplements(class Bar { }, Foo)).toThrow('[ts-interface-core] Один из интерфейсов не имеет обязательного маркера.')

  // Правильное использование
  interfaceDefineHasInstance(Foo)
  expect(interfaceDefineInterfaces({}, Foo)).toBeInstanceOf(Object)
})

test('Пользовательская реализация интерфейса', () => {
  // Все функции интерфейсов(interface*()) определяют свойства с дескрипторами не позволяющими изменить интерфейс и его реализацию.

  // Маркер INTERFACE_MARKER_PROPERTY и функция hasInstance() могут быть использованы для пользовательской реализации.
  // Определим конструктор класса-интерфейса
  const customMarker = Symbol()
  class CustomInterface {
    static [INTERFACE_MARKER_PROPERTY] = customMarker; // Доступ к маркеру.
    static [Symbol.hasInstance] = interfaceHasInstance; // Функция проверки маркера.
    [customMarker] = INTERFACE_MARKER_ID; // Маркер на прототипе со значением идентифицирующим его как маркер-интерфейса.
  }

  class NativeExtends extends CustomInterface { }
  // @ts-expect-error TS подсказывает о нереализованных свойствах, но нам этого не нужно.
  class Impl implements CustomInterface { }
  interfaceImplements(Impl, CustomInterface)

  const custom = new CustomInterface()
  const native = new NativeExtends()
  const impl = new Impl()
  const ins = interfaceDefineInterfaces({}, CustomInterface)

  expect(custom instanceof CustomInterface).toBe(true)
  expect(native instanceof CustomInterface).toBe(true)
  expect(impl instanceof CustomInterface).toBe(true)
  expect(ins instanceof CustomInterface).toBe(true)

  // Сам класс интерфейс(конструктор) - не является реализующим сам себя.
  expect(CustomInterface instanceof CustomInterface).toBe(false)
})

test('Ошибки пользовательской реализации', () => {
  class IFoo { }
  // Пользовательская реализация интерфейса должна определить все три свойства.
  // Если не до конца определенный интерфейс попадет в функцию interfaceDefineHasInstance(), последняя ничего не делает
  // и возвращает ранее определенный маркер класса
  const fooMarker = Symbol()
  // Забудем определить Symbol.hasInstance
  // @ts-expect-error
  IFoo[INTERFACE_MARKER_PROPERTY] = fooMarker
  Object.defineProperty(IFoo.prototype, fooMarker, { value: INTERFACE_MARKER_ID })

  // Возвратит ранее определенный маркер и проигнорирует все действия определения свойств - маркера и Symbol.hasInstance
  const marker = interfaceDefineHasInstance(IFoo)
  expect(marker).toBe(fooMarker)

  class Foo implements IFoo { }
  // Не вызовет ошибки, так как маркер есть на IFoo
  interfaceImplements(Foo, IFoo)

  // ... но интерфейс не реализован
  const fooError = new Foo()
  expect(fooError instanceof IFoo).toBe(false)

  // ... исправим допущенную ошибку
  Object.defineProperty(IFoo, Symbol.hasInstance, { value: interfaceHasInstance })
  const foo = new Foo()
  expect(foo instanceof IFoo).toBe(true)
})

test('Как это работает', () => {
  // Класс - это особая функция определяющая прототип. Инстанс, созданный от этого класса, получит ссылку на прототип.

  class Foo { foo = null }
  const insFoo = new Foo()
  expect(Foo.prototype).toBe(Object.getPrototypeOf(insFoo))

  // Наследование классов создает цепочку прототипов, где каждый потомок ссылается на прототип предка.

  class Bar extends Foo { bar = null }
  const insBar = new Bar()
  const barProto = Object.getPrototypeOf(insBar)
  const fooProto = Object.getPrototypeOf(barProto)
  expect(Foo.prototype).toBe(fooProto)

  // Независимо от иерархии наследования мы можем получить доступ и проверить свойство на любом уровне.

  expect('foo' in insBar).toBe(true)

  // Такой механизм позволяет маркировать прототипы на этапе определения класса и использовать этот маркер в
  // `Symbol.hasInstance` для симуляции наследования и реализации интерфейсов.

  // Нам так же потребуется общее для всех классов свойство, в котором можно хранить
  // уникальный символ интерфейса, и любой глобальный уникальный идентификатор символа
  const INTERFACE_ID = INTERFACE_MARKER_ID // string - об этом id ниже
  // Здесь можно использовать любой id(необязательно тот же что выше)
  const INTERFACE_PROPERTY = Symbol.for(INTERFACE_ID)

  // Определяем класс, который предполагается использовать как интерфейс.

  // Интерфейс может быть абстрактным(но необязательно)
  abstract class FirstInterface { }
  abstract class SecondInterface { }

  // Добавим несколько свойств классу, что позволит использовать его в любом из вариантов наследования:
  // * `extends`    - Встроенное наследование.
  // * `implements` - Симуляция реализации.
  // * `instanceof` - Использование оператора, для проверки принадлежности интерфейсу.

  // Все нижеописанные операции упрощены для наглядности. Улилиты `interface*` устанавливают скрытые неизменяемые
  // свойства и проверяют наличие свойств перед определением.

  // Сгенерируем уникальный маркер интерфейса SomeInterface
  const firstInterfaceMarker = Symbol()

  // Сохраним маркер на конструкторе класса - для свойства используется глобальный символ
  // @ts-expect-error
  FirstInterface[INTERFACE_PROPERTY] = firstInterfaceMarker

  // Статический метод всех интерфейсов(классов), вызываемый в контексте класса с
  // аргументом тестируемого инстанса
  function customHasInstance (this: any, ins: any): boolean {
    try {
      // Получаем маркер через глобальное свойство(определено выше) и проверяем его
      // наличие в цепочке прототипов
      return this[INTERFACE_PROPERTY] in ins
    } catch {
      return false
    }
  }

  // Переопределим символ оператора instanceof
  Object.defineProperty(FirstInterface, Symbol.hasInstance, { value: customHasInstance })

  // Сохраним маркер на прототипе - именно его сможет детектировать Symbol.hasInstance
  // вместо проверки ссылки на прототип
  // @ts-expect-error
  FirstInterface.prototype[firstInterfaceMarker] = INTERFACE_ID

  // То же самое для других интерфейсов
  const secondInterfaceMarker = Symbol()
  // @ts-expect-error
  SecondInterface[INTERFACE_PROPERTY] = secondInterfaceMarker
  Object.defineProperty(SecondInterface, Symbol.hasInstance, { value: customHasInstance })
  // @ts-expect-error
  SecondInterface.prototype[secondInterfaceMarker] = INTERFACE_ID

  // Определим класс и реализуем интерфейс

  class SecondImpl extends FirstInterface implements SecondInterface { }
  const ins = new SecondImpl()

  // Встроенное наследование получит ссылку на прототип в котором присутствует символ
  // интерфейса
  expect(ins instanceof FirstInterface).toBe(true)
  // Реализация implements не может установить прототип и оператор instanceof не сработает
  expect(ins instanceof SecondInterface).toBe(false)

  // Для симуляции реализации нам потребуется получить символ интерфейса и установить
  // его явно прототипу класса-реализации
  // @ts-expect-error
  SecondImpl.prototype[SecondInterface[INTERFACE_PROPERTY]] = INTERFACE_ID
  expect(ins instanceof SecondInterface).toBe(true)

  // Множественная реализация расширенных интерфейсов.

  // Выше мы определили `INTERFACE_ID` в значениях каждого симола интерфейса. Статический метод `Symbol.hasInstance` не
  // использует это значение, но оно может быть полезным для поиска всех символов множественной реализации интерфейсов.

  // Интерфейсы могут расширяться другими интерфейсами
  class SomeInterface extends FirstInterface implements SecondInterface { }

  const someInterfaceMarker = Symbol()
  // @ts-expect-error
  SomeInterface[INTERFACE_PROPERTY] = someInterfaceMarker
  Object.defineProperty(SomeInterface, Symbol.hasInstance, { value: customHasInstance })
  // @ts-expect-error
  SomeInterface.prototype[someInterfaceMarker] = INTERFACE_ID
  // @ts-expect-error
  SomeInterface.prototype[secondInterfaceMarker] = INTERFACE_ID
  // Добавим любой символ
  const anySymbolProperty = Symbol()
  // Символ не являющийся маркером интерфейса
  // @ts-expect-error
  SomeInterface.prototype[anySymbolProperty] = '<any value>'

  // Значение `INTERFACE_ID` используется для идентификации символа как маркера интерфейса и позволяет получить все
  // символы в цепочке прототипов.

  // Собираем все маркеры. Символ anySymbolProperty будет проигнорирован.
  const markers = interfaceMarkersOfClass(SomeInterface)
  expect(markers.size).toBe(3) // FirstInterface + SecondInterface + SomeInterface

  // Реализовать сразу все три интерфейса можно одной из функций:
  // * interfaceExtends() - для класса
  // * interfaceDefineMarkers() - для объекта

  // Для простоты примера создадим свой объект
  const obj = Object.fromEntries([...markers].map((marker) => [marker, null]))
  expect(obj instanceof FirstInterface).toBe(true)
  expect(obj instanceof SecondInterface).toBe(true)
  expect(obj instanceof SomeInterface).toBe(true)
})

test('typing', () => {
  // Проверка типов, что все функции принимают все типы классов и игнорируют функции

  // Все конструкторы для абстрактных классов.
  abstract class AFoo {
    //
  }
  abstract class ADefaultFoo {
    constructor() { /**/ }
  }
  abstract class APublicFoo {
    public constructor() { /**/ }
  }
  abstract class APrivateFoo {
    private constructor() { /**/ }
  }
  abstract class AProtectedFoo {
    private constructor() { /**/ }
  }

  // Все конструкторы для обычных классов
  class Foo {
    //
  }
  class DefaultFoo {
    constructor() { /**/ }
  }
  class PublicFoo {
    public constructor() { /**/ }
  }
  class PrivateFoo {
    private constructor() { /**/ }
  }
  class ProtectedFoo {
    private constructor() { /**/ }
  }

  // Обычная функция
  function foo () { /**/ }
  const bar = () => null

  // Функция - принимающая типом класс
  function fun (cls: TClass): any { return cls }

  fun(AFoo)
  fun(ADefaultFoo)
  fun(APublicFoo)
  fun(APrivateFoo)
  fun(AProtectedFoo)
  fun(Foo)
  fun(DefaultFoo)
  fun(PublicFoo)
  fun(PrivateFoo)
  fun(ProtectedFoo)

  // @ts-expect-error - Argument of type '() => void' is not assignable to parameter of type 'TClass'.ts(2345)
  fun(foo)
  // @ts-expect-error - Argument of type '() => null' is not assignable to parameter of type 'TClass'.ts(2345)
  fun(bar)

  // Пробуем более расширенные классы со свойствами и методами
  abstract class Base {
    protected readonly _param: number
    protected constructor(param: number) {
      this._param = param
    }
    get param (): number {
      return this._param
    }
  }
  class Impl extends Base {
    private constructor() {
      super(123)
    }
    sum (value: number) {
      return value + this._param
    }
    static create (): Impl {
      return new Impl()
    }
  }
  // Работатет
  fun(Impl)
  // ... как и с функцией
  // @ts-expect-error - Argument of type '(value: number) => number' is not assignable to parameter of type 'TClass'.ts(2345)
  fun(Impl.create().sum)
})

test('property in object', () => {
  // Проверить наличие скрытого свойство можно несколькими способами
  class SomeInterface { }
  Object.defineProperty(SomeInterface, INTERFACE_MARKER_PROPERTY, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Symbol()
  })

  // Какой из них самый быстрый - в файле hasOwn.bench.ts
  expect(Object.hasOwn(SomeInterface, INTERFACE_MARKER_PROPERTY)).toBe(true)
  expect(Object.prototype.hasOwnProperty.call(SomeInterface, INTERFACE_MARKER_PROPERTY)).toBe(true)
  expect(Object.getOwnPropertyDescriptor(SomeInterface, INTERFACE_MARKER_PROPERTY)).toBeInstanceOf(Object)
})

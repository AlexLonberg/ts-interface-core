
const _hasOwnProperty = Object.prototype.hasOwnProperty

// Это единственный способ описать все возможные конструкторы и использовать их как эталонный тип.
abstract class _AbstractClassPrivateConstructor {
  private constructor(..._: any[]) { /**/ }
}
abstract class _AbstractClassProtectedConstructor {
  protected constructor(..._: any[]) { /**/ }
}
class _ClassPrivateConstructor {
  private constructor(..._: any[]) { /**/ }
}
class _ClassProtectedConstructor {
  protected constructor(..._: any[]) { /**/ }
}

type TClassConstructor = (new (..._: any[]) => any) | (abstract new (..._: any[]) => any)
type TClassPrivateConstructor = (typeof _AbstractClassPrivateConstructor) | (typeof _AbstractClassProtectedConstructor) | (typeof _ClassPrivateConstructor) | (typeof _ClassProtectedConstructor)
type TClass = TClassConstructor | TClassPrivateConstructor
// Такое определение не имеет смысла и допускает обычные функции
// type TClassPrivateConstructor = (Function & { prototype: object & { constructor: Function } })

/**
 * Глобальный уникальный идентификатор. Применение:
 *
 *  + Получение глобального символа {@link INTERFACE_MARKER_PROPERTY}.
 *  + Идентификация любого символа(свойства) на объекте, который является уникальным маркером интерфейса.
 */
const INTERFACE_MARKER_ID = 'ts-interface-core-f784779d-80eb-473a-960d-2248475b280e'

/**
 * Скрытое свойство классов-интерфейсов на котором определен уникальный символ интерфейса.
 */
const INTERFACE_MARKER_PROPERTY: unique symbol = Symbol.for(INTERFACE_MARKER_ID)

/**
 * Функция устанавливаемая классам-интерфейсам для переопределения статического метода {@link Symbol.hasInstance}.
 *
 * **Note:** Все функции интерфейсов `interface*()` определяют свойства с дескрипторами не позволяющими изменить
 * интерфейс и его реализацию. Маркер {@link INTERFACE_MARKER_PROPERTY} и функция {@link interfaceHasInstance()} могут
 * использоваться для пользовательской реализации.
 *
 * @param this Класс интерфейс. Это не параметр, а `this` класса.
 * @param ins  Проверяемый инстанс.
 * @returns Результат наличия уникального символа(маркера интерфейса) на объекте.
 *
 * @example
 * ```ts
 * // Определим конструктор класса-интерфейса
 * const customMarker = Symbol()
 * class CustomInterface {
 *   static [INTERFACE_MARKER_PROPERTY] = customMarker; // Доступ к маркеру.
 *   static [Symbol.hasInstance] = interfaceHasInstance; // Функция проверки маркера.
 *   [customMarker] = INTERFACE_MARKER_ID; // Реализация через наследование.
 * }
 *
 * class Impl implements CustomInterface { }
 * interfaceImplements(Impl, CustomInterface)
 * const impl = new Impl()
 * expect(impl instanceof CustomInterface).toBe(true)
 * ```
 */
function interfaceHasInstance (this: { [INTERFACE_MARKER_PROPERTY]: symbol }, ins: any): boolean {
  try {
    return this[INTERFACE_MARKER_PROPERTY] in ins
  } catch {
    return false
  }
}

/**
 * Возвращает маркер интерфейса или `null`(если интерфейс не был определен).
 *
 * @param cls Ссылка на определение класса-интерфейса.
 *
 * @example
 * ```ts
 * class Foo {...}
 * const none = interfaceMarker(Foo) // null
 * interfaceDefineHasInstance(Foo)
 * const marker = interfaceMarker(Foo) // symbol
 * ```
 */
function interfaceMarker (cls: TClass): null | symbol {
  let marker: any
  if (_hasOwnProperty.call(cls, INTERFACE_MARKER_PROPERTY) && (typeof (marker = (cls as any)[INTERFACE_MARKER_PROPERTY]) === 'symbol')) {
    return marker
  }
  return null
}

/**
 * Возвращает все маркеры интерфейсов определенные на объекте и во всей цепочке прототипов.
 *
 * **Note:** В отличие от {@link interfaceMarker()}, которая получает маркер из свойства определенного на классе, эта
 * функция собирает свойства символы с уникальным глобальным {@link INTERFACE_MARKER_ID}.
 *
 * @param obj Объект на котором нужно найти все символы, в том числе и в цепочке прототипов.
 * @param symbols Набор для записи уникальных маркеров, который возвращается функцией.
 */
function interfaceMarkersOfObjectInto (obj: object, symbols: Set<symbol>): Set<symbol> {
  let proto: null | object = obj
  while (proto) {
    const props = Object.getOwnPropertySymbols(proto)
    for (const key of props) {
      const ds = Object.getOwnPropertyDescriptor(proto, key)
      if (ds && _hasOwnProperty.call(ds, 'value') && (ds.value === INTERFACE_MARKER_ID)) {
        symbols.add(key)
      }
    }
    proto = Object.getPrototypeOf(proto)
  }
  return symbols
}

/**
 * Возвращает все маркеры интерфейсов определенные на объекте и во всей цепочке прототипов.
 *
 * **Note:** В отличие от {@link interfaceMarker()}, которая получает маркер из свойства определенного на классе, эта
 * функция собирает свойства символы с уникальным глобальным {@link INTERFACE_MARKER_ID}.
 *
 * @param obj Объект на котором нужно найти все символы, в том числе и в цепочке прототипов.
 */
function interfaceMarkersOfObject (obj: object): Set<symbol> {
  return interfaceMarkersOfObjectInto(obj, new Set())
}

/**
 * Возвращает все маркеры интерфейсов определенные во всей цепочке прототипов инстанса, исключая сам инстанс.
 *
 * **Note:** В отличие от {@link interfaceMarkersOfObject()}, которая обходит объект и его прототипы, эта функция
 * игнорирует свойства инстанса, извлекает прототип и делегирует сбор символов {@link interfaceMarkersOfObject()}.
 *
 * @param ins Ссылка на инстанс класса.
 */
function interfaceMarkersOfInstance (ins: object): Set<symbol> {
  return interfaceMarkersOfObjectInto(Object.getPrototypeOf(ins), new Set())
}

/**
 * Возвращает все маркеры интерфейсов определенные на прототипе класса и всей цепочке прототипов.
 *
 * **Note:** В отличие от {@link interfaceMarker()}, которая получает маркер из свойства определенного на классе, эта
 * функция извлекает прототип и делегирует сбор символов {@link interfaceMarkersOfObject}.
 *
 * @param cls Ссылка на определение класса-интерфейса.
 */
function interfaceMarkersOfClass (cls: TClass): Set<symbol> {
  return interfaceMarkersOfObjectInto(cls.prototype, new Set())
}

/**
 * Устанавливает классу маркер интерфейса и добавляет метод проверки наследников класса `Symbol.hasInstance()`.
 *
 * **Note:** Функция должна использоваться всеми интерфейсами, определенными как классы.
 *
 * **Warning:** Прототип не должен быть заморожен.
 *
 * @param cls    Ссылка на определение класса-интерфейса.
 * @param marker Уникальный символ, который будет добавлен прототипу класса и доступен по {@link INTERFACE_MARKER_PROPERTY}.
 * @throws Ошибка, если на прототипе класса определен другой маркер или невозможно переопределить {@link Symbol.hasInstance}.
 *
 * @example
 * ```ts
 * class Foo {}
 * const marker = Symbol()
 * interfaceDefineHasInstanceMarker(Foo, marker)
 *
 * const obj = {}
 * interfaceDefineMarkers(obj, marker)
 * obj instanceof Foo // true
 * ```
 */
function interfaceDefineHasInstanceMarker (cls: TClass, marker: symbol): void {
  // Проверяем возможность определения интерфейса
  let noMarker = false
  if (!_hasOwnProperty.call(cls, INTERFACE_MARKER_PROPERTY)) {
    noMarker = true
  }
  else if ((cls as any)[INTERFACE_MARKER_PROPERTY] !== marker) {
    throw new Error('[ts-interface-core] Невозможно переопределить интерфейс с другим маркером.')
  }
  // Переопределяем метод проверки наследования
  if (!_hasOwnProperty.call(cls, Symbol.hasInstance)) {
    Object.defineProperty(cls, Symbol.hasInstance, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: interfaceHasInstance
    })
  }
  else if ((cls as any)[Symbol.hasInstance] !== interfaceHasInstance) {
    throw new Error('[ts-interface-core] Невозможно переопределить hasInstance.')
  }
  // Определяем статическое свойство для всех классов, для доступа к символу
  if (noMarker) {
    Object.defineProperty(cls, INTERFACE_MARKER_PROPERTY, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: marker
    })
  }
  // Так же определяем символ на самом прототипе, иначе не сработает instanceof для простого наследования класса-интерфейса
  if (!_hasOwnProperty.call(cls.prototype, marker)) {
    Object.defineProperty(cls.prototype, marker, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: INTERFACE_MARKER_ID // NOTE Помечаем маркер - что он относится к нашим интерфейсам.
    })
  }
}

/**
 * Вызывает {@link interfaceDefineHasInstanceMarker()}, после чего замораживает прототип класса {@link cls} с помощью
 * `Object.freeze(cls.prototype)`.
 */
function interfaceDefineHasInstanceMarkerAndFreeze (cls: TClass, marker: symbol): void {
  interfaceDefineHasInstanceMarker(cls, marker)
  Object.freeze(cls.prototype)
}

/**
 * Устанавливает классу маркер интерфейса и добавляет метод проверки наследников класса {@link Symbol.hasInstance}.
 *
 * **Note:** Функция должна использоваться всеми интерфейсами, определенными как классы. Для справки: внутри использует
 * {@link interfaceDefineHasInstanceMarker()}, вызывая с параметром `Symbol`.
 *
 * **Warning:** Прототип не должен быть заморожен.
 *
 * @param cls Ссылка на определение класса-интерфейса.
 * @returns Возвращает маркер. Если для класса маркер был определен ранее, функция ничего не делает и возвращает ранее
 *          определенный маркер.
 * @throws Ошибка, если невозможно переопределить {@link Symbol.hasInstance}.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineHasInstance(Foo)
 *
 * class Bar implements Foo {}
 * interfaceImplements(Bar, Foo)
 * (new Bar()) instanceof Foo // true
 * ```
 */
function interfaceDefineHasInstance (cls: TClass): symbol {
  if (_hasOwnProperty.call(cls, INTERFACE_MARKER_PROPERTY)) {
    return (cls as any)[INTERFACE_MARKER_PROPERTY]
  }
  const marker = Symbol()
  interfaceDefineHasInstanceMarker(cls, marker)
  return marker
}

/**
 * Вызывает {@link interfaceDefineHasInstance()}, после чего замораживает прототип класса {@link cls} с помощью
 * `Object.freeze(cls.prototype)`.
 */
function interfaceDefineHasInstanceAndFreeze (cls: TClass): symbol {
  const marker = interfaceDefineHasInstance(cls)
  Object.freeze(cls.prototype)
  return marker
}

/**
 * Добавляет объекту, который должен реализовать интерфейсы, маркеры.
 *
 * Если объекту уже установлено свойство `marker(Symbol)`, функция пропускает маркер.
 *
 * **Warning:** Объект не должен быть заморожен.
 *
 * @param obj     Объект, который должен реализовать интерфейсы.
 * @param markers Уникальные маркеры интерфейсов.
 * @returns       Возвращает первый аргумент `obj`.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineHasInstance(Foo)
 * class Bar {}
 * interfaceDefineHasInstance(Bar)
 *
 * const obj = {}
 * interfaceDefineMarkers(obj, interfaceMarker(Foo), interfaceMarker(Bar))
 * ```
 */
function interfaceDefineMarkers<T extends object> (obj: T, ...markers: symbol[]): T {
  for (const marker of markers) {
    if (!_hasOwnProperty.call(obj, marker)) {
      Object.defineProperty(obj, marker, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: INTERFACE_MARKER_ID
      })
    }
  }
  return obj
}

/**
 * Добавляет объекту, который должен реализовать интерфейсы, маркеры всех интерфейсов.
 *
 * Если объекту уже установлено свойство `marker(Symbol)`, функция пропускает маркер.
 *
 * **Warning:** Объект не должен быть заморожен.
 *
 * @param obj        Объект, который должен реализовать интерфейсы.
 * @param interfaces Интерфейсы для реализации с ранее установленными маркерами.
 * @returns          Возвращает первый аргумент `obj`.
 * @throws Ошибка, если один из интерфейсов не имеет обязательного маркера.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineHasInstance(Foo)
 * class Bar {}
 * interfaceDefineHasInstance(Bar)
 *
 * const obj = {}
 * interfaceDefineInterfaces(obj, Foo, Bar)
 * ```
 */
function interfaceDefineInterfaces<T extends object> (obj: T, ...interfaces: TClass[]): T {
  for (const inter of interfaces) {
    const marker = interfaceMarker(inter)
    if (!marker) {
      throw new Error('[ts-interface-core] Один из интерфейсов не имеет обязательного маркера.')
    }
    if (!_hasOwnProperty.call(obj, marker)) {
      Object.defineProperty(obj, marker, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: INTERFACE_MARKER_ID
      })
    }
  }
  return obj
}

/**
 * Добавляет прототипу класса, который должен реализовать интерфейсы, маркеры.
 *
 * Если прототипу уже установлено свойство `marker(Symbol)`, функция пропускает маркер.
 *
 * **Warning:** Объект не должен быть заморожен.
 *
 * @param cls     Класс который должен реализовать интерфейсы.
 * @param markers Уникальные маркеры интерфейсов.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineHasInstance(Foo)
 * class Bar {}
 * interfaceDefineHasInstance(Bar)
 *
 * class Some {}
 * interfaceImplementMarkers(Some, interfaceMarker(Foo), interfaceMarker(Bar))
 * ```
 */
function interfaceImplementMarkers (cls: TClass, ...markers: symbol[]): void {
  interfaceDefineMarkers(cls.prototype, ...markers)
}

/**
 * Устанавливает прототипу класса маркеры из интерфейсов, симулирующие реализации, и позволяющие использовать оператор
 * `instanceof` с экземплярами этих классов.
 *
 * **Note:** Смотри так же {@link interfaceExtends()}.
 *
 * **Warning:** Прототип не должен быть заморожен.
 *
 * @param cls        Класс который должен реализовать интерфейсы `interfaces`.
 * @param interfaces Интерфейсы для реализации с ранее установленными маркерами.
 * @throws Ошибка, если один из интерфейсов не имеет обязательного маркера.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineHasInstance(Foo)
 * class Bar {}
 * interfaceDefineHasInstance(Bar)
 *
 * class Impl implements Foo, Bar {}
 * interfaceImplements(Impl, Foo, Bar)
 * ```
 */
function interfaceImplements (cls: TClass, ...interfaces: TClass[]): void {
  for (const inter of interfaces) {
    const marker = interfaceMarker(inter)
    if (!marker) {
      throw new Error('[ts-interface-core] Один из интерфейсов не имеет обязательного маркера.')
    }
    if (!_hasOwnProperty.call(cls.prototype, marker)) {
      Object.defineProperty(cls.prototype, marker, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: INTERFACE_MARKER_ID
      })
    }
  }
}

/**
 * Вызывает {@link interfaceImplements()}, после чего замораживает прототип класса {@link cls} с помощью
 * `Object.freeze(cls.prototype)`.
 */
function interfaceImplementsAndFreeze (cls: TClass, ...interfaces: TClass[]): void {
  interfaceImplements(cls, ...interfaces)
  Object.freeze(cls.prototype)
}

/**
 * Последовательно вызывает {@link interfaceDefineHasInstance()} и {@link interfaceImplements()}.
 */
function interfaceDefineHasInstanceAndImplements (cls: TClass, ...interfaces: TClass[]): symbol {
  const marker = interfaceDefineHasInstance(cls)
  interfaceImplements(cls, ...interfaces)
  return marker
}

/**
 * Последовательно вызывает {@link interfaceDefineHasInstance()} и {@link interfaceImplements()}, после чего
 * замораживает прототип класса {@link cls} с помощью `Object.freeze(cls.prototype)`.
 */
function interfaceDefineHasInstanceAndImplementsAndFreeze (cls: TClass, ...interfaces: TClass[]): symbol {
  const marker = interfaceDefineHasInstance(cls)
  interfaceImplements(cls, ...interfaces)
  Object.freeze(cls.prototype)
  return marker
}

/**
 * Устанавливает прототипу класса маркеры из интерфейсов, симулирующие реализации, и позволяющие использовать оператор
 * `instanceof` с экземплярами этих классов. Эту функцию рекомендуется использовать для расширения интерфейсов.
 *
 * **Warning:** Прототип не должен быть заморожен.
 *
 * **Note:** В отличие от {@link interfaceImplements()}, которая устанавливает маркеры из свойств класса-интерфейса,
 * эта функция получает все маркеры в цепочке прототипов каждого интерфейса. Используете этот метод для интерфейсов
 * расширенных от других интерфейсов.
 *
 * @param cls Класс который должен реализовать интерфейсы `interfaces`.
 * @param interfaces Интерфейсы и/или классы в цепочке которых есть маркеры интерфейсов. В отличие от
 *  {@link interfaceImplements()} эта функция не вызывает ошибок, если класс не содержит ни одного маркера.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineHasInstance(Foo)
 * class Bar extends Foo {}
 * interfaceDefineHasInstance(Bar)
 *
 * class Impl implements Foo, Bar {}
 * interfaceExtends(Impl, Bar)
 * ```
 */
function interfaceExtends (cls: TClass, ...interfaces: TClass[]): void {
  const markers: Set<symbol> = new Set()
  for (const inter of interfaces) {
    const marker = interfaceMarker(inter)
    if (marker) {
      markers.add(marker)
    }
    interfaceMarkersOfObjectInto(inter.prototype, markers)
  }
  for (const marker of markers) {
    if (!_hasOwnProperty.call(cls.prototype, marker)) {
      Object.defineProperty(cls.prototype, marker, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: INTERFACE_MARKER_ID
      })
    }
  }
}

/**
 * Вызывает {@link interfaceExtends()}, после чего замораживает прототип класса {@link cls} с помощью
 * `Object.freeze(cls.prototype)`.
 */
function interfaceExtendsAndFreeze (cls: TClass, ...interfaces: TClass[]): void {
  interfaceExtends(cls, ...interfaces)
  Object.freeze(cls.prototype)
}

/**
 * Последовательно вызывает {@link interfaceDefineHasInstance()} и {@link interfaceExtends()}.
 */
function interfaceDefineHasInstanceAndExtends (cls: TClass, ...interfaces: TClass[]): symbol {
  const marker = interfaceDefineHasInstance(cls)
  interfaceExtends(cls, ...interfaces)
  return marker
}

/**
 * Последовательно вызывает {@link interfaceDefineHasInstance()} и {@link interfaceExtends()}, после чего замораживает
 * прототип класса {@link cls} с помощью `Object.freeze(cls.prototype)`.
 */
function interfaceDefineHasInstanceAndExtendsAndFreeze (cls: TClass, ...interfaces: TClass[]): symbol {
  const marker = interfaceDefineHasInstance(cls)
  interfaceExtends(cls, ...interfaces)
  Object.freeze(cls.prototype)
  return marker
}

export {
  type TClass,
  INTERFACE_MARKER_ID,
  INTERFACE_MARKER_PROPERTY,
  interfaceHasInstance,
  interfaceMarker,
  interfaceMarkersOfObjectInto,
  interfaceMarkersOfObject,
  interfaceMarkersOfInstance,
  interfaceMarkersOfClass,
  interfaceDefineHasInstanceMarker,
  interfaceDefineHasInstanceMarkerAndFreeze,
  interfaceDefineHasInstance,
  interfaceDefineHasInstanceAndFreeze,
  interfaceDefineMarkers,
  interfaceDefineInterfaces,
  interfaceImplementMarkers,
  interfaceImplements,
  interfaceImplementsAndFreeze,
  interfaceDefineHasInstanceAndImplements,
  interfaceDefineHasInstanceAndImplementsAndFreeze,
  interfaceExtends,
  interfaceExtendsAndFreeze,
  interfaceDefineHasInstanceAndExtends,
  interfaceDefineHasInstanceAndExtendsAndFreeze
}

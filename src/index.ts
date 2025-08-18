/**
 * Скрытое свойство классов-интерфейсов на котором определен уникальный символ интерфейса.
 */
const INTERFACE_MARKER_PROPERTY = Symbol.for('ts-interface-core-f784779d-80eb-473a-960d-2248475b280e')

/**
 * Возвращает маркер интерфейса или `null`, если маркер не определен.
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
function interfaceMarker (cls: (abstract new (..._: any[]) => any) | (new (..._: any[]) => any)): null | symbol {
  let marker: any
  if ((INTERFACE_MARKER_PROPERTY in cls) && (typeof (marker = cls[INTERFACE_MARKER_PROPERTY]) === 'symbol')) {
    return marker
  }
  return null
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
 * @throws Ошибка, если на прототипе класса определен другой маркер.
 *
 * @example
 * ```ts
 * class Foo {}
 * const marker = Symbol()
 * interfaceDefineHasInstanceMarker(Foo, marker)
 *
 * const obj = {}
 * interfaceImplementMarkers(obj, marker)
 * obj instanceof Foo // true
 * ```
 */
function interfaceDefineHasInstanceMarker (cls: (abstract new (..._: any[]) => any) | (new (..._: any[]) => any), marker: symbol): void {
  // Определяем статическое свойство для всех классов, для доступа к символу
  if (!Object.getOwnPropertyDescriptor(cls, INTERFACE_MARKER_PROPERTY)) {
    Object.defineProperty(cls, INTERFACE_MARKER_PROPERTY, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: marker
    })
  }
  else if ((cls as any)[INTERFACE_MARKER_PROPERTY] !== marker) {
    throw new Error('[ts-interface-core] Невозможно переопределить интерфейс с другим маркером.')
  }
  // Так же определяем символ на самом прототипе, иначе не сработает instanceof для простого наследования класса-интерфейса
  if (!Object.getOwnPropertyDescriptor(cls.prototype, marker)) {
    Object.defineProperty(cls.prototype, marker, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: marker // NOTE Оставляем как ключ для определения класса интерфейса.
    })
  }
  // Переопределяем метод проверки наследования
  if (!Object.getOwnPropertyDescriptor(cls, Symbol.hasInstance)) {
    Object.defineProperty(cls, Symbol.hasInstance, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function (ins: any) {
        try {
          return this[INTERFACE_MARKER_PROPERTY] in ins
        } catch {
          return false
        }
      }
    })
  }
}

/**
 * Устанавливает классу маркер интерфейса и добавляет метод проверки наследников класса `Symbol.hasInstance()`.
 *
 * **Note:** Функция должна использоваться всеми интерфейсами, определенными как классы. Для справки: внутри использует
 * {@link interfaceDefineHasInstanceMarker()}, вызывая с параметром `Symbol`.
 *
 * **Warning:** Прототип не должен быть заморожен.
 *
 * @param cls Ссылка на определение класса-интерфейса.
 * @returns Возвращает маркер.
 * @throws Ошибка, если на прототипе класса определен другой маркер.
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
function interfaceDefineHasInstance (cls: (abstract new (..._: any[]) => any) | (new (..._: any[]) => any)): symbol {
  const marker = Symbol()
  interfaceDefineHasInstanceMarker(cls, marker)
  return marker
}

/**
 * Добавляет объекту, который должен реализовать интерфейсы, маркеры всех интерфейсов.
 *
 * Если объекту уже установлено свойство `marker(Symbol)`, функция пропускает маркер.
 *
 * **Warning:** Объект не должен быть заморожен.
 *
 * @param ins     Объект, который должен реализовать интерфейсы.
 * @param markers Уникальные маркеры интерфейсов.
 * @returns       Возвращает первый аргумент `ins`.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineHasInstance(Foo)
 * class Bar {}
 * interfaceDefineHasInstance(Bar)
 *
 * const obj = {}
 * interfaceImplementMarkers(obj, interfaceMarker(Foo), interfaceMarker(Bar))
 * ```
 */
function interfaceImplementMarkers<T extends object> (ins: T, ...markers: symbol[]): T {
  for (const marker of markers) {
    if (!Object.getOwnPropertyDescriptor(ins, marker)) {
      Object.defineProperty(ins, marker, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: null
      })
    }
  }
  return ins
}

/**
 * Добавляет объекту, который должен реализовать интерфейсы, маркеры всех интерфейсов.
 *
 * Если объекту уже установлено свойство `marker(Symbol)`, функция пропускает маркер.
 *
 * **Warning:** Объект не должен быть заморожен.
 *
 * @param ins        Объект, который должен реализовать интерфейсы.
 * @param interfaces Интерфейсы для реализации с ранее установленными маркерами.
 * @returns          Возвращает первый аргумент `ins`.
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
 * interfaceImplementInterfaces(obj, Foo, Bar)
 * ```
 */
function interfaceImplementInterfaces<T extends object> (ins: T, ...interfaces: ((abstract new (..._: any[]) => any) | (new (..._: any[]) => any))[]): T {
  for (const inter of interfaces) {
    const marker = interfaceMarker(inter)
    if (!marker) {
      throw new Error('[ts-interface-core] Один из интерфейсов не имеет обязательного маркера.')
    }
    if (!Object.getOwnPropertyDescriptor(ins, marker)) {
      Object.defineProperty(ins, marker, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: null
      })
    }
  }
  return ins
}

/**
 * Устанавливает прототипу класса маркеры из интерфейсов, симулирующие реализации, и позволяющие использовать оператор
 * `instanceof` с экземплярами этих классов.
 *
 * **Warning:** Прототип не должен быть заморожен.
 *
 * @param cls        Класс который должен реализовать интерфейсы `interfaces`.
 * @param interfaces Интерфейсы для реализации с ранее установленными маркерами.
 * @throws Ошибка, если один из интерфейсов не имеет обязательного маркера.
 *
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
function interfaceImplements (cls: (abstract new (..._: any[]) => any) | (new (..._: any[]) => any), ...interfaces: ((abstract new (..._: any[]) => any) | (new (..._: any[]) => any))[]): void {
  for (const inter of interfaces) {
    const marker = interfaceMarker(inter)
    if (!marker) {
      throw new Error('[ts-interface-core] Один из интерфейсов не имеет обязательного маркера.')
    }
    if (!Object.getOwnPropertyDescriptor(cls.prototype, marker)) {
      Object.defineProperty(cls.prototype, marker, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: null
      })
    }
  }
}

export {
  INTERFACE_MARKER_PROPERTY,
  interfaceMarker,
  interfaceDefineHasInstanceMarker,
  interfaceDefineHasInstance,
  interfaceImplementMarkers,
  interfaceImplementInterfaces,
  interfaceImplements
}

/**
 * Скрытое свойство классов-интерфейсов на котором определен уникальный символ интерфейса.
 */
const INTERFACE_MARKER_PROPERTY = Symbol('INTERFACE_MARKER_PROPERTY')

/**
 * Возвращает маркер интерфейса или `null`, если маркер не определен.
 *
 * @param cls Ссылка на определение класса-интерфейса.
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
 * **Note:** Эта функция должна использоваться всеми интерфейсами, определенными как классы.
 *
 * @param cls    Ссылка на определения класса-интерфейса.
 * @param marker Уникальный символ, который будет добавлен как статическое свойство классу-интерфейсу и доступен по {@link INTERFACE_MARKER_PROPERTY}.
 */
function interfaceDefineHasInstance (cls: (abstract new (..._: any[]) => any) | (new (..._: any[]) => any), marker: symbol): void {
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
    throw new Error('Невозможно переопределить интерфейс с другим маркером.')
  }
  // Так же определяем символ на самом прототипе, иначе не сработает instanceof для простого наследования класса-интерфейса
  if (!Object.getOwnPropertyDescriptor(cls.prototype, marker)) {
    Object.defineProperty(cls.prototype, marker, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: marker
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
 * Эта функция аналогична {@link interfaceDefineHasInstance}, но самостоятельно генерирует маркер и устанавливает его классу.
 */
function interfaceDefineHasInstanceMarker (cls: (abstract new (..._: any[]) => any) | (new (..._: any[]) => any)): symbol {
  const marker = Symbol()
  interfaceDefineHasInstance(cls, marker)
  return marker
}

/**
 * Добавляет маркер объекту, который должен реализовать интерфейс.
 *
 * @param ins    Объект, который должен реализовать интерфейс с символом `marker`.
 * @param marker Уникальный маркер интерфейса.
 * @returns Возвращает первый аргумент `ins`.
 */
function interfaceDefineImplementInterfaceMarker<T extends object> (ins: T, marker: symbol): T {
  if (!Object.getOwnPropertyDescriptor(ins, marker)) {
    Object.defineProperty(ins, marker, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: null
    })
  }
  return ins
}

/**
 * Добавляет маркер объекту, который должен реализовать интерфейсы.
 *
 * @param ins        Объект, который должен реализовать интерфейсы.
 * @param interfaces Интерфейсы для реализации.
 * @returns Возвращает первый аргумент `ins`.
 */
function interfaceDefineImplementInterfaces<T extends object> (ins: T, ...interfaces: ((abstract new (..._: any[]) => any) | (new (..._: any[]) => any))[]): T {
  for (const inter of interfaces) {
    const marker = interfaceMarker(inter)
    if (!marker) {
      throw new Error('Один из интерфейсов не имеет обязательного маркера.')
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
 * Устанавливает прототипам класса маркеры из интерфейсов симулирующие реализации и позволяющие использовать оператор
 * `instanceof` с экземплярами этих классов.
 *
 * @param cls        Класс который должен реализовать интерфейсы `interfaces`.
 * @param interfaces Интерфейсы для реализации с ранее установленными маркерами.
 */
function interfaceImplements (cls: (abstract new (..._: any[]) => any) | (new (..._: any[]) => any), ...interfaces: ((abstract new (..._: any[]) => any) | (new (..._: any[]) => any))[]): void {
  for (const inter of interfaces) {
    const marker = interfaceMarker(inter)
    if (!marker) {
      throw new Error('Один из интерфейсов не имеет обязательного маркера.')
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
  interfaceDefineHasInstance,
  interfaceDefineHasInstanceMarker,
  interfaceDefineImplementInterfaceMarker,
  interfaceDefineImplementInterfaces,
  interfaceImplements
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const _hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * Глобальный уникальный идентификатор библиотеки.
 */
const LIBRARY_ID = 'ts-interface-core-acdfa2f4-97d7-4cce-b880-3226dee0304d'

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
 * Дескриптор интерфейса.
 */
interface InterfaceDescriptor<T> {
  /**
   * Уникальный маркер связанный с этим интерфейсом.
   *
   * Именно этот маркер используется для проверки принадлежности типа с помощью {@link is()}.
   */
  readonly marker: symbol
  /**
   * Дескрипторы родительских интерфейсов переданные аргументами в фабрику {@link InterfaceDescriptorFactory}.
   */
  readonly parents: null | readonly InterfaceDescriptor<any>[]
  /**
   * Плоский набор уникальных дескрипторов, которые должны использоваться в runtime для симуляции реализации, путем
   * установки маркеров на целевой тип. Наличие этого свойства зависит от наличия {@link parents} и не имеет текущего
   * дескриптора.
   */
  readonly descriptors: null | readonly InterfaceDescriptor<any>[]
  /**
   * Симулировать реализацию интерфейса и всех его предков.
   *
   * Функция определяет на прототипе класса собственный дескриптор и {@link descriptors} которых еще нет в цепочке
   * прототипов. По умолчанию, {@link PropertyDescriptor} устанавливается с атрибутами
   * `{configurable: false, enumerable: false, writable: false, value:InterfaceDescriptor}`, где `value` - ссылается на
   * текущий собственный дескриптор {@link InterfaceDescriptor}.
   *
   * @param cls Целевой класс. **Warning:** Прототип не должен быть заморожен.
   */
  readonly impl: (cls: TClass) => void
  /**
   * То же что и {@link impl()}, но после определения маркеров замораживает прототип `Object.freeze(cls.prototype)`.
   */
  readonly implAndFreeze: (cls: TClass) => void
  /**
   * То же что и {@link impl()}, но применяется к объекту а не прототипу.
   *
   * @param obj Объект не должен быть заморожен.
   */
  readonly implAny: (obj: object) => void
  /**
   * То же что и {@link implAny()}, но после определения маркеров замораживает объект `Object.freeze(obj)`.
   */
  readonly implAnyAndFreeze: (obj: object) => void
  /**
   * Принадлежит ли объект этому типу. Фактически проверяется наличие {@link marker} во всей цепочке прототипа.
   *
   * @param ins Любой объект.
   */
  readonly is: (ins: any) => ins is T
}

/**
 * Фабрика дескрипторов.
 */
interface InterfaceDescriptorFactory {
  /**
   * Создает дескриптор интерфеса для симуляции наследования и проверки принадлежности типу.
   *
   * @param parents Дополнительные дескрипторы-предки, от которых расширен целевой тип.
   */
  <T> (...parents: readonly InterfaceDescriptor<any>[]): InterfaceDescriptor<T>
  /**
   * Идентификатор библиотеки.
   */
  readonly libraryId: typeof LIBRARY_ID
  /**
   * Устанавливает прототипу класса дескрипторы, которых еще нет в цепочке прототипов.
   *
   * **Note:** Эта функция последовательно вызывает {@link InterfaceDescriptor.impl()}.
   *
   * @param cls         Целевой класс.
   * @param descriptors Набор дескрипторов.
   * @returns Возвращает аргумент `cls`, приведенный к типу `T`.
   */
  readonly mark: <T>(cls: TClass, descriptors: Iterable<InterfaceDescriptor<any>>) => T
  /**
   * То же самое что {@link mark()}, но после применения замораживает прототип класса.
   */
  readonly markAndFreeze: <T>(cls: TClass, descriptors: Iterable<InterfaceDescriptor<any>>) => T
  /**
   * Маркирует любой объект(в том числе функцию).
   *
   * В отличие от {@link mark()}, эта функция не вытаскивает прототип `cls.prototype`, а маркирует сам объект.
   *
   * @param obj         Целевой объект.
   * @param descriptors Набор дескрипторов.
   * @returns Возвращает аргумент `obj`, приведенный к типу `T`.
   */
  readonly markAny: <T>(obj: object, descriptors: Iterable<InterfaceDescriptor<any>>) => T
  /**
   * То же самое что {@link markAny()}, но после применения замораживает объект.
   */
  readonly markAnyAndFreeze: <T>(obj: object, descriptors: Iterable<InterfaceDescriptor<any>>) => T
  /**
   * Собирает все дескрипторы, определенные на всей цепочке прототипов этого класса.
   *
   * @param cls Целевой класс.
   */
  readonly descriptorsOf: (cls: TClass) => InterfaceDescriptor<any>[]
  /**
   * Собирает все дескрипторы, определенные на объекте и на всей цепочке прототипов для этого объекта.
   *
   * @param obj Целевой объект.
   */
  readonly descriptorsOfAny: (obj: object) => InterfaceDescriptor<any>[]
}

/**
 * Добавляет объекту, который должен симулировать реализацию, дескриптор интерфейса.
 *
 * Если в цепочке прототипа уже есть `(marker in obj)`, функция ничего не делает.
 *
 * @param obj Целевой объект, функция или прототип класса(`cls.prototype`). **Warning:** Объект не должен быть заморожен.
 * @param descriptor Дескриптор интерфейса.
 *
 * @example
 * ```ts
 * class Foo {}
 * interfaceDefineDescriptor(Foo.prototype, descriptor)
 * ```
 */
function interfaceDefineDescriptor (obj: object, descriptor: InterfaceDescriptor<any>): void {
  if (!(descriptor.marker in obj)) {
    Object.defineProperty(obj, descriptor.marker, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: descriptor
    })
  }
}

/**
 * Сплющивает набор всех дескрипторов в плоский массив с уникальными элементами.
 */
function flattenDescriptors (ds: readonly InterfaceDescriptor<any>[]): readonly InterfaceDescriptor<any>[] {
  const flatSet = new Set(ds)
  for (let i = 0; i < ds.length; ++i) {
    const child = ds[i]!.descriptors
    if (child) {
      // Так как у предков поле descriptors УЖЕ плоское, мы просто копируем его
      for (let j = 0; j < child.length; j++) {
        flatSet.add(child[j]!)
      }
    }
  }
  return Object.freeze(Array.from(flatSet))
}

/**
 * Собирает все дескрипторы интерфейсов определенные на объекте и во всей цепочке прототипов.
 *
 * @param obj Целевой объект. Для классов это должен быть прототип `cls.prototype`.
 */
function interfaceDescriptorsOfAny (obj: object): InterfaceDescriptor<any>[] {
  const descriptors: InterfaceDescriptor<any>[] = []
  let proto: null | object = obj
  while (proto) {
    const props = Object.getOwnPropertySymbols(proto)
    for (const key of props) {
      const ds = Object.getOwnPropertyDescriptor(proto, key)
      // Проверяем что символ не является геттером и ссылается на объект с нашим дескриптором.
      // Секрет в том, что свойство-символ равно полю marker.
      if (ds && _hasOwnProperty.call(ds, 'value') && ds.value && (typeof ds.value === 'object') &&
        _hasOwnProperty.call(ds.value, 'marker') &&

        (ds.value.marker === key)) {
        descriptors.push(ds.value as InterfaceDescriptor<any>)
      }
    }
    proto = Object.getPrototypeOf(proto)
  }
  return descriptors
}

function interfaceMark<T> (cls: TClass, descriptors: Iterable<InterfaceDescriptor<any>>): T {
  for (const ds of descriptors) {
    ds.impl(cls)
  }
  return cls as T
}

function interfaceMarkAny<T> (obj: object, descriptors: Iterable<InterfaceDescriptor<any>>): T {
  for (const ds of descriptors) {
    ds.implAny(obj)
  }
  return obj as T
}

/**
 * Создает дескриптор интерфеса для симуляции наследования и проверки принадлежности типу.
 *
 * @param ps Дополнительные дескрипторы-предки, от которого расширен целевой тип.
 */
function interfaceDescriptorFactory<T> (...ps: readonly InterfaceDescriptor<any>[]): InterfaceDescriptor<T> {
  const marker = Symbol()
  const parents = ps.length > 0 ? Object.freeze(ps) : null
  const descriptors = parents ? flattenDescriptors(parents) : null

  const implAny = (obj: object) => {
    interfaceDefineDescriptor(obj, d)
    if (descriptors) {
      for (let i = 0; i < descriptors.length; ++i) {
        interfaceDefineDescriptor(obj, descriptors[i]!)
      }
    }
  }

  const d: InterfaceDescriptor<T> = {
    marker,
    parents,
    descriptors,
    impl (cls: TClass) {
      implAny(cls.prototype)
    },
    implAndFreeze (cls: TClass) {
      const proto = cls.prototype
      implAny(proto)
      Object.freeze(cls.prototype)
    },
    implAny,
    implAnyAndFreeze (obj: object) {
      implAny(obj)
      Object.freeze(obj)
    },
    is (ins: any): ins is T {
      // Для сценария, когда у нас гарантировано объект - оптимистичный try/catch будет производительнее чем постоянная
      // проверка typeof Смотри tryInVsTypeof.bench.ts. Оставил этот кусок для справки.
      // return ((typeof ins === 'object') ? ins : (typeof ins === 'function')) ? (marker in ins) : false
      try {
        return (marker in ins)
      } catch { }
      return false
    }
  }

  return Object.freeze(d)
}

// Расширяем функцию до нашего интерфейса
const factoryDescriptors: PropertyDescriptorMap = {
  libraryId: { value: LIBRARY_ID },
  mark: {
    value: interfaceMark
  },
  markAndFreeze: {
    value: (cls: TClass, descriptors: Iterable<InterfaceDescriptor<any>>) => {
      const proto = cls.prototype
      interfaceMarkAny(proto, descriptors)
      Object.freeze(proto)
      return cls
    }
  },
  markAny: {
    value: interfaceMarkAny
  },
  markAnyAndFreeze: {
    value: (obj: object, descriptors: Iterable<InterfaceDescriptor<any>>) => {
      interfaceMarkAny(obj, descriptors)
      return Object.freeze(obj)
    }
  },
  descriptorsOf: {
    value: (cls: TClass) => interfaceDescriptorsOfAny(cls.prototype)
  },
  descriptorsOfAny: {
    value: interfaceDescriptorsOfAny
  }
}

Object.defineProperties(interfaceDescriptorFactory, factoryDescriptors)
const interfaceDescriptor: InterfaceDescriptorFactory = Object.freeze(interfaceDescriptorFactory) as InterfaceDescriptorFactory

namespace interfaceDescriptor {
  export type I<T> = InterfaceDescriptor<T>
  export type TClass = TClassConstructor | TClassPrivateConstructor
  // NOTE Почему убран этот F? Самое частое использование типа - это I, а буква F выпадает первой в списке и все время
  // заставляет делать лишнее телодвижение
  // export type F = InterfaceDescriptorFactory
}

export {
  LIBRARY_ID,
  type TClass,
  type InterfaceDescriptor,
  type InterfaceDescriptorFactory,
  interfaceDescriptor
}

import {
  // INTERFACE_MARKER_PROPERTY,
  // interfaceMarker,
  // interfaceDefineHasInstance,
  interfaceDefineHasInstanceMarker,
  // interfaceDefineImplementInterfaceMarker,
  // interfaceDefineImplementInterfaces,
  interfaceImplements
} from '../src/index.js'

interface Console {
  log (..._: any[]): void
}

declare let console: Console

abstract class IFoo {
  abstract readonly name: string
}
// Помечаем интерфейсы основанные на абстрактных классах символами и изменяем Symbol.hasInstance
interfaceDefineHasInstanceMarker(IFoo)

abstract class IBar {
  abstract readonly key: number
}
interfaceDefineHasInstanceMarker(IBar)

abstract class IBaz {
  abstract readonly kind: string
}
interfaceDefineHasInstanceMarker(IBaz)

class Impl extends IFoo implements IBar, IBaz {
  name = 'foo'
  key = 123
  kind = 'impl'
}
// Симулиреум реализацию.
// Явно наследуемые классы `extends IFoo`, работают по умолчанию
interfaceImplements(Impl, IBar, IBaz)

const ins = new Impl()
console.log(ins instanceof Impl) // true
console.log(ins instanceof IFoo) // true
console.log(ins instanceof IBar) // true
console.log(ins instanceof IBaz) // true

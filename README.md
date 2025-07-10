
# Mark and detect interface conformance with instanceof | TypeScript/JS

    npm i ts-interface-core

Набор минимальных утилит для реализации интерфейсов с `instanceof` в TypeScript.

Позволяет маркировать интерфейс-классы и проверять реализацию через `instanceof`, даже при множественном или виртуальном наследовании.

## Пример использования

```ts
import {
  INTERFACE_MARKER_PROPERTY,
  interfaceMarker,
  interfaceDefineHasInstance,
  interfaceDefineHasInstanceMarker,
  interfaceDefineImplementInterfaceMarker,
  interfaceDefineImplementInterfaces,
  interfaceImplements
} from 'ts-interface-core'

abstract class IFoo {
  abstract readonly name: string
}
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
```


> ⚠️ DEPRECATED

# Mark and detect interface conformance with instanceof | TypeScript/JS

    npm i ts-interface-core

Набор утилит для реализации интерфейсов с `instanceof` в TypeScript.

Позволяет маркировать интерфейс-классы и проверять реализацию через `instanceof`, даже при множественном или виртуальном наследовании.

[Использование в зависимых библиотеках 👇](#использование-в-зависимых-библиотеках)

## Пример использования

```ts
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
  interfaceDefineHasInstanceMarkerAndFreeze,
  interfaceDefineHasInstance,
  interfaceDefineHasInstanceAndFreeze,
  interfaceDefineMarkers,
  interfaceDefineInterfaces,
  interfaceImplementMarkers,
  interfaceImplements,
  interfaceImplementsAndFreeze,
  interfaceExtends,
  interfaceExtendsAndFreeze,
  interfaceDefineHasInstanceAndImplements,
  interfaceDefineHasInstanceAndImplementsAndFreeze,
  interfaceDefineHasInstanceAndExtends,
  interfaceDefineHasInstanceAndExtendsAndFreeze
} from 'ts-interface-core'

abstract class IFoo {
  abstract readonly name: string
}
// Помечаем интерфейсы основанные на абстрактных классах символами и изменяем Symbol.hasInstance
interfaceDefineHasInstance(IFoo)

abstract class IBar {
  abstract readonly key: number
}
interfaceDefineHasInstance(IBar)

abstract class IBaz {
  abstract readonly kind: string
}
interfaceDefineHasInstance(IBaz)

class Impl extends IFoo implements IBar, IBaz {
  name = 'foo'
  key = 123
  kind = 'impl'
}
// Симулируем реализацию.
// Явно наследуемые классы `extends IFoo`, работают по умолчанию
interfaceImplements(Impl, IBar, IBaz)

const ins = new Impl()
console.log(ins instanceof Impl) // true
console.log(ins instanceof IFoo) // true
console.log(ins instanceof IBar) // true
console.log(ins instanceof IBaz) // true
console.log(new class {} instanceof IFoo) // false
```

## Использование в зависимых библиотеках

Когда несколько библиотек зависят от одного общего пакета `ts-interface-core`, рекомендуется указывать его в разделе `peerDependencies` каждой библиотеки. Это необходимо для обеспечения корректной работы функций, которые опираются на идентичность символа `INTERFACE_MARKER_PROPERTY`. Несогласованность версий или множественные экземпляры `ts-interface-core` приведут к неочевидным ошибкам.

**Подход, рекомендуемый при работе с библиотеками, разделяющими общие определения:**

В библиотеке зависимой от `ts-interface-core` [peerDependencies](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies):

```json
"peerDependencies": {
  "ts-interface-core": "^0.3.0"
}
```

В основном приложении обеспечьте одну версию `ts-interface-core` для всех зависимостей через [overrides](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides):

```json
"dependencies": {
  "ts-interface-core": "0.3.0"
},
"overrides": {
  "ts-interface-core": "0.3.0"
}
```

> Фактически, глобальный символ, используемый как свойство доступа к символу интерфейса, получен путем `Symbol.for(uuid)`, и даже разные версии библиотек не вызовут ошибку.

Проверить все установленные версии одного пакета можно командой `npm list ts-interface-core`. Если обнаружено несколько версий, команда покажет дерево зависимостей:

```
my-app@1.0.0
├─┬ my-lib@0.1.0
│ └── ts-interface-core@0.2.0
└── ts-interface-core@0.3.0
```

Смотрите так же [npm dedupe](https://docs.npmjs.com/cli/v11/commands/npm-dedupe).


# 🧬 Runtime interface simulation, metadata, and type guards for TypeScript.

    npm i ts-interface-core

Набор утилит, позволяющих перенести интерфейсы `TypeScript` в runtime. Определяйте дескрипторы интерфейсов, симулируйте их реализацию классами или объектами и выполняйте безопасное сужение типов через `I.is()`.

💡 **Почему это удобно?**

* **Единая точка входа**: Всё (утилиты, TypeGuards, типы) экспортируется через одну функцию `interfaceDescriptor`.
* **Безопасные Type Guards**: Метод `.is()` сужает типы на уровне компилятора `TypeScript`.
* **Поддержка любых сущностей**: Работает с классами, их инстансами, POJO-объектами и даже функциями.

## 🚀 Быстрый старт

```ts
import { interfaceDescriptor } from 'ts-interface-core'

// 1. Объявляем интерфейсы и их дескрипторы
interface IFoo {
  readonly foo: boolean
}
const IFoo = interfaceDescriptor<IFoo>()

// Расширяем интерфейсы, передавая родителей
interface IBar extends IFoo {
  readonly bar: number
}
const IBar = interfaceDescriptor<IBar>(IFoo)

// 2. Реализуем интерфейс в классе
class MyService implements IBar {
  foo = true
  bar = 42
}

// Применяем симуляцию
// (автоматически подключаются и родительские интерфейсы)
IBar.impl(MyService)

// 3. Безопасная проверка и сужение типов в рантайме
const value: unknown = new MyService()

if (IFoo.is(value)) {
  console.log(value.foo) // TypeScript знает, что это IFoo
}

if (IBar.is(value)) {
  console.log(value.bar) // TypeScript знает, что это IBar
}
```

## 🛠️ Гибкие сценарии

### 🪄 Маркировка обычных объектов и функций

Для объектов, анонимных классов или функций используйте метод `implAny` или `implAndFreeze`:

```ts
const config = { host: 'localhost', port: 8080 }

// Маркируем и замораживаем объект
IConfig.implAndFreeze(config)

console.log(IConfig.is(config)) // true
```

### 🎲 Namespace типов

Вам не нужно импортировать вспомогательные типы отдельно — они уже доступны прямо в `interfaceDescriptor`:

```ts
import { interfaceDescriptor } from 'ts-interface-core'

// interfaceDescriptor.I<T> — тип дескриптора
// interfaceDescriptor.TClass — тип конструктора класса

function registerPlugin(
  target: interfaceDescriptor.TClass,
  descriptor: interfaceDescriptor.I<any>
) {
  descriptor.impl(target)
}
```

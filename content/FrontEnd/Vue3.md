---
title: 'Vue3'
description: ''
categories: []
tags: []
date: 2024-08
---

## Hello Vue3

> [!quote] 参考：
> - [简介 | Vue.js (vuejs.org)](https://cn.vuejs.org/guide/introduction.html)
> - [尚硅谷Vue3入门到实战，最新版vue3+TypeScript前端开发教程_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Za4y1r7KE/?vd_source=009e48c9eac896fdd5399a398c31a382)  
> 版本：Vue 3.4.x；  
> VS Code 插件 Vue-Official；  
> 浏览器插件 [Vue.js devtools - Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/vuejs-devtools/olofadcdnkkjdfgjcmjaadnlehnnihnl)；  

### 创建项目

使用 Vite 创建一个 Vue 项目：

```shell
npm create vue@latest
```

![[_resources/attachment/bcca1399-db9a-4abb-a0b4-d507fa03bc5d.png]]

根据提示执行：

```shell
cd vue-project
npm install
npm run dev
```

验证：访问 [http://localhost:5173/](http://localhost:5173/)

![[_resources/attachment/2ec67a4b-df9e-4a81-a03d-6becf39e461d.png]]

### ESLint 与代码格式化

安装 [eslint-plugin-vue](https://eslint.vuejs.org/user-guide) 和 prettier 插件，如果创建项目时勾选了对应选项则可以跳过此步。

```shell
npm install --save-dev eslint eslint-plugin-vue
npm install --save-dev prettier
```

VS Code 和 IDEA 都有对应的 [Prettier](https://prettier.io/) 插件，可以配置保存时格式化和快捷键。

![[_resources/attachment/8952f6c6-a86f-4474-82d7-ec30b5adbd08.png]]

![[_resources/attachment/16cecd72-dc5e-46a0-905a-5dd516c71ec9.png]]

使用 IDEA 也可以不使用 Prettier，而使用内置的 ESLint 工具，配置与 Prettier 插件同理。

![[_resources/attachment/32a548bb-de3c-461c-90de-70a55c70f99e.png]]

### css

- 安装 normalize.css 并在 main.js 中 import 使用

```shell
npm install normalize.css

# main.js
import 'normalize.css';
```

- less 与 sass

```shell
npm install --save-dev sass less
```

### Axios

```shell
npm install axios
```

前往 [[FrontEnd/Axios封装|Axios 封装]]

### Element Plus

[快速开始 | Element Plus (element-plus.org)](https://element-plus.org/zh-CN/guide/quickstart.html)

```shell
npm install element-plus
```

main.js 全局导入

```js
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
```

通过插件自动按需导入：

```shell
npm install -D unplugin-vue-components unplugin-auto-import
```

### Vite

前往 [[FrontEnd/前端开发环境配置#Vite 配置|Vite 配置]]

## setup 钩子

[API风格：选项式 vs 组合式](https://cn.vuejs.org/guide/introduction.html#api-styles)

[`setup()`](https://cn.vuejs.org/api/composition-api-setup.html) 钩子是在组件中使用组合式 API 的入口，可以在基于选项式 API 的组件中使用 setup() 集成基于组合式 API 的代码。

需要注意:  

1. setup() 默认应该同步地返回一个对象，除非使用 [`Suspense`](https://cn.vuejs.org/guide/built-ins/suspense.html);
2. setup() 自身没有对组件实例的访问权，在其中访问 this 将得到 undefined，可以在选项式 API 中访问组合式 API 暴露的值 (通过组件实例 this)，反之不行；
3. setup(props, context) 有两个参数，响应式的 props，context 上下文对象。

```js
<template>
  每个 `*.vue` 文件最多可以包含一个顶层 `<template>` 块。
</template>

<script>
export default {
  name: 'xxx',
  // 组合式 api 的入口
  setup() {
    // 变量
    let var1 = ''
    // 方法
    function fun1() {}
    // 返回的对象会暴露给模板和组件实例
    return { var1, fun1 }
  },
  // 其他选项式 api 方法...
}
</script>

<stype scoped>
  每个 `*.vue` 文件可以包含多个 `<style>` 标签。
  支持使用 `v-bind` CSS 函数将 CSS 的值链接到动态的组件状态
  .text { color: v-bind(color); }
</stype>
```

语法糖：上面 `setup()` 中的内容等价于下面带 setup 属性的 script 标签：

```js
<script setup>
  // defineOptions 可用于在组合式中定义选项式API中的一些参数，例如 name
  defineOptions({
    name:'xxx'
  })
  // 变量
  let var1 = ''
  // 方法
  function fun1() {}
</script>
```

[`<script setup>`可以与普通`<script>`同时存在](https://cn.vuejs.org/api/sfc-script-setup.html#usage-alongside-normal-script)。

## 核心响应式 API

> [!note] 一个概念：副作用  
> 在 Vue 中，副作用（side effect）通常指依赖于响应式数据的函数，当数据变化时，这些函数会重新执行。例如渲染函数、计算属性、监听。

### ref、reactive

在 setup 中声明的属性默认不是响应式的，需要使用 `ref` 方法包裹，如 `let name = ref('zhangsan')`，返回的 name 是一个 RefImpl 的实例，其 `value` 属性即 `name.value` 就是指向内部值的响应式对象。

在 JS 代码中需要通过 `xxx.value` 来操作响应式对象；而 ref 在模板中使用的时候会自动解包**顶级的** ref 属性，不需要 `.value` 后缀。

除了 ref 还可以使用 `reactive`，与 ref 不同的是它会返回一个 JS Proxy 对象，使对象本身具有响应式能力而不需要 `.value` 后缀。

需要注意的是：代理对象与原始对象不相等，只有代理对象才具有响应式能力；对同一个原始对象调用 reactive 总是返回同样的代理对象，对已存在的代理对象调用 reactive 会返回它本身。

```js
const raw = {}
const proxy = reactive(raw)
// 代理对象和原始对象不是全等的
console.log(proxy === raw) // false

// 在同一个对象上调用 reactive() 会返回相同的代理
console.log(reactive(raw) === proxy) // true
// 在一个代理上调用 reactive() 会返回它自己
console.log(reactive(proxy) === proxy) // true
```

ref 与 reactive 都具有深层响应性，即对嵌套的对象属性也生效，使用浅层 `shallowRef` 和 `shallowReactive` 可以用于避免维护复杂深层数据的响应性开销。

`triggerRef` 可以强制触发 shallowRef 的副作用，通常可以在 shallowRef 响应式对象的深层属性发生变化后，手动触发副作用。

```js
const shallow = shallowRef({
  greet: 'Hello, world'
})

// 触发该副作用第一次应该会打印 "Hello, world"
watchEffect(() => {
  console.log(shallow.value.greet)
})

// 这次变更不应触发副作用，因为这个 ref 是浅层的
shallow.value.greet = 'Hello, universe'

// 打印 "Hello, universe"
triggerRef(shallow)
```

> [!note] ref vs reactive，建议直接 ref 一把梭
> 1. reactive 不支持基本类型，如 string、number、boolean，ref 包装对象类型时调用的也是 reactive；
> 2. reactive 不支持替换整个对象 (可以使用 `Object.assign` 赋值)、解构操作不友好 (失去响应性)。

### toRef、toRefs

前面提到 reactive 解构操作不友好，这时就可以使用 toRef、toRefs 解决：

```js
import { ref, reactive, toRef, toRefs } from 'vue'

let person = reactive({ name: '张三', age: 18, gender: '男' })
// age、name、gender 仍具有响应性
let age = toRef(person, 'age')
let { name, gender } = toRefs(person)
```

### customRef：track 与 trigger

[customRef](https://cn.vuejs.org/api/reactivity-advanced.html#customref) 允许我们在响应式对象的 get、set 方法中添加一些逻辑。

customRef 接收一个工厂函数，这个函数需要返回一个包含 get、set 函数的对象，函数的入参 track() 用于**收集依赖**、trigger() 用于**触发更新**。

当一个响应式数据被读取时，`track()` 将读取该数据的副作用收集到一个全局的订阅者集合中。

`trigger()` 会在订阅者集合中找到并触发依赖该对象的所有副作用。

下面是一个防抖 ref 的示例：

```js
import { customRef } from 'vue'
export function useDebouncedRef(value, delay = 200) {
  let timeout
  return customRef((track, trigger) => {
    return {
      get() {
        track() // 收集依赖
        return value
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger() // 触发更新
        }, delay)
      }
    }
  })
}

// 使用
<script setup>
import { useDebouncedRef } from './debouncedRef'
const text = useDebouncedRef('hello')
</script>

<template>
  <input v-model="text" />
</template>
```

### computed

computed 与普通方法的区别是具有缓存。

```js
import { ref, computed } from 'vue'

// 数据
const count = ref(1)

// 计算属性默认是只读的
const c1 = computed(() => count.value + 1)
c1.value++ // 报错

// 传入 set 方法，变为可写
const c2 = computed({
  get: () => count.value + 1,
  set: (val) => {
    count.value = val - 1
  }
})
c2.value = 1 // 可写
console.log(count.value) // 0
```

### watch

watch(source, callback, options) 可以监听一个或多个响应式数据源，在数据源发生变化时执行回调函数。

**第一个参数** `source` 是所监听的源，它可以是：一个 ref、一个响应式对象、返回一个值的函数、由以上类型的值组成的数组。

**第二个参数** `callback` 是要执行的回调，它接受三个参数 `(value, oldValue, onCleanup)`，onCleanup 会在下一次回调函数执行前执行，用于副作用清理，如取消前面未完成的异步请求。

```js
watch(data, (newValue, oldValue, onCleanup) => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then(response => response.json())
    .then(data => {
      console.log(data);
    });
  onCleanup(() => {
    controller.abort(); // 取消未完成的请求
  });
});
```

**第三个参数**是可选参数：

- `immediate`: 在 watch 创建时立即触发一次回调 (此时 oldValue 是 undefined)，默认 false；
- `deep`：深层监听，默认 false；
- `flush`：回调函数执行的时机，`pre`(默认，DOM 更新前)、`post`(DOM 更新后)、`sync`(数据变化后立即同步调用)；
- `once`：回调函数只会运行一次。侦听器将在回调函数首次运行后自动停止；

**返回值**是停止该监听的函数：

```js
const stop = watch(source, callback)
// 当已不再需要该侦听器时：
stop()
```

下面是监听不同类型数据源的示例，注意会有不同的行为：

1. **一个 ref 对象**，监听的是整个 value，默认不开启深层监听；

```js
// 基本类型数据
const count = ref(0)
watch(count, (value, oldValue) => {
  // ...
})

// 对象类型数据，默认监听的是整个对象
const person = ref({ name: '张三', age: 18, gender: '男' })
watch(
  person,
  (value, oldValue) => {
    console.log('person变化了', value, oldValue)
  },
  // 开启深层监听，此时可以监听对象属性的变化，但属性的旧值和新值相同
  { deep: true }
)
```

2. **一个响应式对象**，默认开启深层监听；

```js
// 默认会开启深层监听
const state = reactive({ count: 0 })
watch(state, (value, oldValue) => {
  // ...
})
```

这种方式也有 reactive() 的局限性，无法替换整个对象，只能修改其属性，且无法获取到属性的旧值。

3. **返回一个值的函数**，默认不开启深层监听，常用于监听对象的属性 (可以拿到旧值)；

```js
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (value, oldValue) => {
    // ...
  }
)
```

4. **由以上类型的值组成的数组**，默认不开启深层监听，回调函数接收两个数组，分别对应监听的数据源的新旧值；

```js
watch([fooRef, barRef], ([foo, bar], [prevFoo, prevBar]) => {
  // ...
})
```

### watchEffect

与 watch 的区别是，watchEffect 创建时会立即执行一次，并且不需要显式声明要监听的数据源，它自动追踪所有在函数中访问到的响应式数据，并在其发生变化时执行回调。可以简化在需要监听多个响应式数据时的代码。

```js
const count = ref(0)
watchEffect(() => {
  console.log(count.value)
})
// 立即执行一次 -> 输出 0
count.value++
// 监听到变化 -> 输出 1
```

## 路由

### RouterLink 标签

`<RouterLink>` 标签跳转写法：

```js
// 静态路径，根据 path 跳转
<RouterLink to="/home">跳转</RouterLink>

// 根据 to 对象跳转，可以使用 path 或 name 匹配
<RouterLink :to="{path: '/home'}">跳转</RouterLink>
<RouterLink :to="{name: 'abc'}">跳转</RouterLink>

// 指定浏览器历史记录的写入方式为 replace ，默认是 push
<RouterLink replace to="/home">跳转</RouterLink>
```

### 路由传参

**query 传参**

```js
// query 相当于问号传参
<RouterLink :to="`/home?a=${a}&b=${b}`">跳转</RouterLink>
// 等价于
<RouterLink
  :to="{
    path: '/home',
    query: {
      a: 1,
      b: 2
    }
  }"
>
  跳转
</RouterLink>
```

**params 传参**

```js
// params 相当于路径传参，只能使用 name 匹配
<RouterLink :to="`/home/${a}/${b}`">跳转</RouterLink>
// 等价于
<RouterLink
  :to="{
    name: 'home',
    params: {
      a: 1,
      b: 2
    }
  }"
>
  跳转
</RouterLink>
// 使用 params 传参，需要在 router 配置中使用占位符
{
  name: 'home',
  path: 'home/:a/:b',
  component: Home
}
```

**props 传参**

```js
// 方式1，props 置为 true，会将 params 参数作为 props 传给路由组件
{
  name: 'home',
  path: 'home/:a/:b',
  component: Home,
  props: true
}

// 方式2，对象写法，会将对象中的 k-v 作为 props 传递
props: {a: 1, b: 2}

// 方式3，函数写法，将返回对象中的 k-v 作为 props 传递
props: (route) => route.query
```

### JS 路由跳转

JS 代码控制动态跳转：

```js
import { useRouter } from 'vue-router'

const router = useRouter()
// 调用 push 或 replace 方法
router.push({
  name: 'abc'
})
```

## pinia

[Pinia](https://pinia.vuejs.org/zh/introduction.html) 是 Vue 的状态管理库，允许我们跨组件或页面共享状态。其中的三个概念 state、getter、action 可以类比组件中的 data、computed、methods。

### 创建 store 的两种 API 风格

选项式：

```js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})
```

组合式：

```js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // ref() 就是 state 属性
  const count = ref(0)
  // computed() 就是 getters
  const doubleCount = computed(() => count.value * 2)
  // function() 就是 actions
  function increment() {
    count.value++
  }
  return { count, doubleCount, increment }
})
```

组合式 API 中要让 pinia 正确识别 state，你必须在 setup store 中返回 state 的所有属性。

组合式 API 更加灵活，可以使用其他全局属性 (例如 router)、使用其他组合式 API 例如 computed、watch。但要注意不应该 return 不属于 store 的属性或方法。

### 读写 store

```js
<script setup>
import { useCounterStore } from '@/stores/counter'

// 读取
const countStore = useCounterStore()

// 直接修改
countStore.count = 100
// 批量修改多个
countStore.$patch({
  a: 99,
  b: 100
})
// 调用 action 方法修改
countStore.increment(100)
</script>
```

上面 patch 传递的对象如果比较复杂例如包含集合，都需要创建新的集合，可以传递一个函数来说明变更操作：

```js
store.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
})
```

解构时不要使用 `toRefs` 而是要使用 `storeToRefs`：

```js
<script setup>
import { storeToRefs } from 'pinia'
const store = useCounterStore()
// storeToRefs 只会解构响应式的属性，会跳过 action 和非响应式属性
const { name, doubleCount } = storeToRefs(store)
// 作为 action 的 increment 可以直接解构
const { increment } = store
</script>
```

### 监听变化

可以通过 store 的 `$subscribe()` 方法监听 state 的变化，与 `watch()` 相比，它的好处是在 patch 批量修改后只触发一次。

例如可以在状态发生变化时将 state 持久化到 localStorage，在 defineStore 时从 localStorage 中提取并设置 state 的初始值，实现页面刷新状态不丢失。

```js
myStore.$subscribe((mutation, state) => {
  // 引起变更的方式 direct、patch object、patch function
  mutation.type
  // 当前 store 的 id
  mutation.storeId
  // 只有 type 为 patch object 时，指向传递给 $patch(xxx) 的补丁对象
  mutation.payload

  // 每当状态发生变化时，将 state 持久化到本地存储
  localStorage.setItem('myStore', JSON.stringify(state))
})
```

## 组件通信

### props

`props` 用于父子组件通信，“父传子”直接传，“子传父”由子组件触发父组件传递的方法。

一个组件需要显式声明它从父组件接收的 props，在 `<script setup>` 中使用 `defineProps()` 来声明，否则使用 `props` 来声明。

```js
// 使用 <script setup>
defineProps({
  title: String,
  likes: Number
})
// 非 <script setup>
export default {
  props: {
    title: String,
    likes: Number
  }
}
```

### 透传属性 attrs

[`透传属性`](https://cn.vuejs.org/guide/components/attrs.html#fallthrough-attributes) 指传递给一个组件，但**没有**被该组件声明为 props 或 emits 的属性或者 v-on 事件监听器，例如 class、style 属性。

对于**单根节点**的子组件，透传属性会被自动添加到**根元素**上，例如：

```js
// 组件模板
<button>Click Me</button>
// 使用该组件时传入 class 和 v-on 事件
<MyButton class="large" @click="onClick" />
// 最终渲染结果，class 被透传到根元素上
<button class="large">Click Me</button>
```

注意如果子组件根节点本身已经有了 class 或事件，则会合并或全部触发。

对于**多根节点**的子组件，默认会抛出警告，除非使用 `v-bind` 显式指定了透传到哪个节点上：

```js
<header>...</header>
<main v-bind="$attrs">...</main>
<footer>...</footer>
```

如果子组件还有**孙子组件**，也可以根据相同的规则透传下去。并且透传到子组件的 attrs 也可以作为 props 传给孙子组件。

如果想要**禁止继承**，可以将 `inheritAttrs` 设置为 `false`：

```js
<script setup>
defineOptions({
  inheritAttrs: false
})
</script>
```

如果不想透传到根节点，而是根节点中的子元素，可以结合禁止继承 `inheritAttrs: false` 和 `v-bind` 来实现，例如下面的不想传递给 div 而是 div 中的 button：

```js
<div class="btn-wrapper">
  <button class="btn" v-bind="$attrs">Click Me</button>
</div>
```

在 `<script setup>` 中使用 `useAttrs()`，否则使用 `setup(props, ctx)` 中上下文对象的 `attrs` 属性，来访问透传的属性。

```js
<script setup>
import { useAttrs } from 'vue'
const attrs = useAttrs()
</script>

export default {
  setup(props, ctx) {
    console.log(ctx.attrs)
  }
}
```

**注意 attrs 不是响应式的**。

> [!note] 小结  
> `$attrs` 可用于“父传子、孙”，它包含了除组件所声明的 `props` 和 `emits` 之外的所有其他属性，如 class、style、 v-on 绑定的事件。

### 自定义事件

父组件可以监听子组件通过 `$emit` 触发的方法，`$emit(name, ...args)` 接收一个字符串匹配父组件监听的事件名称，其他参数都会被直接传向监听器：

```js
<!-- 子组件 -->
<button @click="$emit('increaseBy', 1)">
  Increase by 1
</button>

<!-- 父组件 -->
<MyButton @increase-by="(n) => count += n" />
```

在 `<script setup>` 中使用 `defineEmits()` 的返回值，否则使用 `setup(props, ctx)` 中上下文对象的 `emit` 属性来使用 `$emit`。

```js
<script setup>
// <script setup> 中无法直接访问到 $emit 方法
// defineEmits 声明要触发的事件，返回值为 $emit 方法
const emit = defineEmits(['inFocus', 'submit'])
function buttonClick() {
  emit('submit')
}

// 若使用 setup()，使用 emits 选项式属性声明、ctx.emit 方法触发
export default {
  emits: ['inFocus', 'submit'],
  setup(props, ctx) {
    ctx.emit('submit')
  }
}
</script>
```

### 事件总线 mitt

子组件通过 `$emit` 触发的事件**没有冒泡机制**，兄弟组件或父孙组件之间通信，就需要使用外部事件总线，例如 [mitt](https://github.com/developit/mitt)。

可以导出一个模块，或直接全局挂载：

```js
// 在工具类中导出
import mitt from "mitt";
const emitter = mitt()
export default emitter

// 在 main.js 中挂载到全局属性上
app.config.globalProperties.$emitter = mitt()
```

使用很简单，通过 `on`、`off`、`emit` 来监听、取消监听、触发事件：

```js
// listen to an event
emitter.on('foo', e => console.log('foo', e) )

// listen to all events
emitter.on('*', (type, e) => console.log(type, e) )

// fire an event
emitter.emit('foo', { a: 'b' })

// clearing all events
emitter.all.clear()

// working with handler references:
function onFoo() {}
emitter.on('foo', onFoo)   // listen
emitter.off('foo', onFoo)  // unlisten
```

### 双向绑定 v-model

 [`v-model`](https://cn.vuejs.org/guide/components/v-model.html#component-v-model) 实际上是 `v-bind` 和 `v-on` 组合的语法糖，可用于实现父子组件间的双向绑定。

当 `v-model` 用于原生 html 控件 (例如表单控件 input、textarea、select) 时 ，会被编译为 `:value` 和 `@input`，将值绑定到对应控件的 value 属性，监听 input 事件，在事件触发时更新绑定的数据。

```js
<!-- input 上使用 v-model -->
<input type="text" v-model="name" />
<!-- 等价于 -->
<input
  type="text"
  :value="name"
  @input="name = $event.target.value"
/>
```

当用于组件上时相当于 `:moldeValue` + `@update:moldeValue`。

```js
<!-- 在组件上使用 v-model -->
<Child v-model="foo" />
<!-- 等价于 -->
<Child
  :modelValue="foo"
  @update:modelValue="$event => (foo = $event)"
/>
```

Vue3.4 前，子组件使用需要使用 `defineProps()` 和 `defineEmits()` 来接收 props 和声明事件：

```js
<!-- Child.vue -->
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :value="props.modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
```

Vue3.4 新增了 `defineModel()` 宏，简化了写法：

```js
<script setup>
const model = defineModel()
</script>

<template>
  <input v-model="model" />
</template>
```

`defineModel()` 的返回值是一个 ref，它的 `.value` 和父组件 `v-model` 绑定的值同步，即：

```js
<!-- Parent.vue -->
<Child v-model="countModel" />

<!-- Child.vue -->
<script setup>
// model 和父组件的 countModel 同步
const model = defineModel()

function update() {
  // set 方法中会触发 "update:modelValue" 事件
  model.value++
}
</script>

<template>
  <div>Parent bound v-model is: {{ model }}</div>
  <button @click="update">Increment</button>
</template>
```

通过传参可以绑定**多个 v-model**：

```js
<!-- Parent.vue -->
<UserName
  v-model:first-name="first"
  v-model:last-name="last"
/>
<!-- Child.vue -->
<script setup>
const firstName = defineModel('firstName')
const lastName = defineModel('lastName')
</script>

<template>
  <input type="text" v-model="firstName" />
  <input type="text" v-model="lastName" />
</template>
```

### \$refs、\$parent

`$refs` 包含通过模板引用 `ref` 标识的 DOM 元素或子组件实例，`$parent` 指向当前组件的父组件实例。

通过 `$refs` 和 `$parent` 获取到的组件实例，默认**不会暴露**任何在 `<script setup>` 中声明的属性，需要使用 `defineExpose()` 声明要暴露出去的属性才可以被访问到。

```js
<script setup>
import { ref } from 'vue'

const a = 1
const b = ref(2)

defineExpose({
  a,
  b
})
</script>
```

### 依赖注入 inject

[依赖注入](https://cn.vuejs.org/guide/components/provide-inject.html#provide-inject)`provide` 和 `inject` 用于解决**父孙组件** props 透传，需要影响中间层无关组件的问题。

父组件作为依赖提供者，可以向无论多深层的后代组件提供依赖，组件树上任一个后代组件都可以注入由父组件提供的依赖。

使用 `provide('key', 'value')` 来提供依赖，value 可以是任意类型，如果是响应式对象，那么子组件注入就和父组件建立了响应性连接。

```js
// 提供依赖
import { ref, provide } from 'vue'
const msg = ref('123')
provide('message', msg)

// 注入依赖
import { inject } from 'vue'
const msg = inject('message', '默认值')
```

应用层全局提供注入：

```js
// main.js
import { createApp } from 'vue'
const app = createApp({})
app.provide('key', 'value')
```

### 插槽 slot

[插槽](https://cn.vuejs.org/guide/components/slots.html#slots) 用于传递一些模板片段给子组件，在子组件中渲染这些片段。

在子组件中使用 `<slot>` 标签指定父元素提供的模板片段在哪里渲染，插槽内容是在父组件模板中定义的，所以能访问父组件的数据，但无法访问子组件的数据。

```vue
<!--父组件中-->
<SubmitButton>
  Save <!-- 插槽内容 -->
</SubmitButton>

<!--子组件中-->
<button type="submit">
  <slot>
    Submit <!-- 默认内容 -->
  </slot>
</button>

<!--结果-->
<button type="submit">Save</button>
```

**具名插槽**允许我们传递多个插槽内容，即在 slot 上指定 name 属性：

```vue
<!--父组件中-->
<BaseLayout>
  <template v-slot:header>
    <!-- header 插槽的内容放这里 -->
  </template>
</BaseLayout>

<!--子组件中-->
<div class="container">
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</div>
```

`v-slot` 可以使用语法糖 `#` 代替 (默认插槽的名字是 `default`)：

```vue
<BaseLayout>
  <template #header>
    <h1>Here might be a page title</h1>
  </template>

  <template #default>
    <p>A paragraph for the main content.</p>
    <p>And another one.</p>
  </template>

  <template #footer>
    <p>Here's some contact info</p>
  </template>
</BaseLayout>
```

**作用域插槽**允许我们在插槽内容中访问子组件的数据。

对于默认作用域插槽，使用 `v-slot="xxx"` 接收子组件中 `slot` 标签上绑定的 props：

```vue
<!--子组件中-->
<div>
  <slot :text="greetingMessage" :count="1"></slot>
</div>
<!--父组件中-->
<MyComponent v-slot="slotProps">
  {{ slotProps.text }} {{ slotProps.count }}
</MyComponent>
```

可以将作用域插槽的插槽内容想象为一个函数，`slotProps` 就是子组件调用这个渲染函数时传的参数。

对于具名作用域插槽，直接在组件上使用 `v-slot` 将导致编译错误，而是需要在各自的 `<template>` 上使用 `v-slot` ，使用时需要注意不同具名插槽的 slotProps 不共享。

```vue
<MyComponent>
  <template #header="headerProps">
    {{ headerProps }}
  </template>

  <template #default="defaultProps">
    {{ defaultProps }}
  </template>

  <template #footer="footerProps">
    {{ footerProps }}
  </template>
</MyComponent>
```

## 逻辑复用

### 组合式函数

[组合式函数](https://cn.vuejs.org/guide/reusability/composables.html) 指利用 Vue 的组合式 API 来封装和复用**有状态逻辑**的函数。调用组合式函数实际上是将这些函数的逻辑引入到当前组件的 `setup` 函数中。组合式函数返回的状态和方法会被合并到组件的上下文中，从而使组件能够使用这些逻辑。

```js
// useCounter.js
import { ref } from 'vue';

// 组合式函数一般以 useXXX 命名
export function useCounter() {
  const count = ref(0);
  function increment() {
    count.value++;
  }
  // 建议始终返回一个包含 ref 的普通的非响应式对象
  // 便于使用时直接解构得到 ref 对象，保持响应性
  return { count, increment };
}
```

在组件中使用：

```js
// MyComponent.vue
import { useCounter } from './useCounter';

// 直接解构拿到的 count 就是一个 ref 对象
const { count, increment } = useCounter()
```

### 自定义指令

[自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives.html) 主要是为了重用涉及普通元素的底层 DOM 访问的逻辑。

在 `<script setup>` 中，任何以 `v` 开头的驼峰式命名的变量都可以被用作一个自定义指令。

```js
<script setup>
// 自定义指令
const vFocus = {
  // 挂载完成后 focus
  mounted: (el) => el.focus()
}
</script>

<template>
  <input v-focus />
</template>
```

建议只在所需功能只能通过操作 DOM 实现时使用自定义指令；当在组件上使用自定义指令时，它会始终应用于组件的根节点，当应用自定义指令到一个多根组件时，指令将会被忽略且抛出一个警告。

使用 directive 注册到全局：

```js
const app = createApp({})

// 使 v-focus 在所有组件中都可用
app.directive('focus', {
  /* ... */
})
```

当只使用自定义指令的 `mounted` 和 `updated` 钩子时，可以简写：

```js
app.directive('color', (el, binding) => {
  // 这会在 `mounted` 和 `updated` 时都调用
  el.style.color = binding.value
})

<div v-color="color"></div>
```

## 其他

### 全局属性

可以在 main.js 中通过 `app.config.globalProperties` 挂载全局属性、方法。

### 模板引用 ref

ref 标签允许我们直接引用一个 DOM 元素或子组件的实例。

```js
<template>
  <input ref="input">
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 声明一个 ref 来存放该元素的引用，必须和模板里的 ref 同名
const input = ref(null)

onMounted(() => {
  input.value.focus()
})
</script>

<template>
  <input ref="input" />
</template>
```

对于组件，如果一个子组件使用的是选项式 API 或没有使用 `<script setup>`，父组件持有子组件的引用就相当于拥有了完全访问权。  
但使用了 `<script setup>` 的组件其属性默认是私有的，父组件只能访问其通过 `defineExpose` 暴露出来的属性。

### nextTick

修改了响应式数据后，Vue 并不会立即更新 DOM，而是会在下一个事件循环中批量更新。使用 `nextTick` 可以确保在 DOM 更新完成后再执行某些操作。

```js
import { nextTick } from 'vue'

async function increment() {
  count.value++
  await nextTick()
  // 现在 DOM 已经更新了
}
```

### teleport

[Teleport](https://cn.vuejs.org/guide/built-ins/teleport.html#teleport) 是一个内置组件，它可以将一个组件内部的一部分模板“传送”到该组件的 DOM 结构外层的位置去。

```js
<button @click="open = true">Open Modal</button>

<!-- to 的值可以是一个 CSS 选择器字符串，也可以是一个 DOM 元素对象 -->
<Teleport to="body">
  <div v-if="open" class="modal">
    <p>Hello from the modal!</p>
    <button @click="open = false">Close</button>
  </div>
</Teleport>
```

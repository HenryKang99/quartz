---
title: 'Promise'
description: ''
categories: []
tags: []
date: 2024-07
---

## Overview

参考：

- [通俗易懂的 Promise 知识点总结，检验一下你是否真的完全掌握了 Promise？ - 掘金 (juejin.cn)](https://juejin.cn/post/7020335414980378655)
- [10分钟彻底掌握手写promise及原理，难倒面试官！_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1jP4y117Hc/?spm_id_from=333.1007.top_right_bar_window_history.content.click&vd_source=009e48c9eac896fdd5399a398c31a382)

Promise 是 ES6 的新特性，提供了一种更加优雅的**异步编程**方式，避免了回调地狱。配合 async与await 可以写出更加容易理解和调试的代码。

## 三种状态

期约有三种状态：*待定*(pending)、*解决*(resolved/fulfilled)、*拒绝*(rejected)。待定状态可以转化为解决和拒绝状态，并且**不可逆**，对于三种状态，都应该为其定义恰当的行为。

期约的状态是私有的，这是为了防止在外部同步操作中获取并修改期约的状态。期约为解决和拒绝状态维护了两个内部值，分别是*解决值*(value) 和*拒绝理由*(reson)，调用 `resolve()` 和 `reject()` 可以将期约的状态由待定转化为解决和拒绝，并且不可逆，**重复调用会静默失败**。

## 创建 Promise

创建期约时需要传入一个执行器，如果不提供则会抛出 SyntaxError。为了避免期约始终处于待定状态，一般会在执行器函数中使用 `setTimeout()` 来设置一个期望的时间。

```js
let p1 = new Promise((resolve, reject) => {
  setTimeout(reject, 10000); // 10 秒后调用 reject()
  resolve();
  reject(); // 静默失败
});
setTimeout(console.log, 0, p1); // Promise <resolved>

// ---

let p2 = new Promise((resolve, reject) => {
	setTimeout(reject, 10000); // 10 秒后调用 reject()
	// ...
});
setTimeout(console.log, 0, p); // Promise <pending>
setTimeout(console.log, 11000, p); // 11 秒后再检查状态
```

> [!question] Promise 是同步还是异步的？  
> `new Promise(executor)` 时传递的执行器函数会立即同步执行，我们会在其中进行异步操作例如网络请求，当异步操作返回后调用 resolve 或 reject 方法改变期约的状态，当状态改变时，事件循环会调用对应的回调函数 (then、catch、finally)。相当于 Promise 本身是同步的，只不过我们用它来包装、管理异步操作。

```js
// 同步-->微任务(resolve、reject)-->宏任务(setTimeout)
new Promise((resolve,reject) => {
  console.log("resolve before");
  resolve("success");
  setTimeout(() => {
    console.log("setTimeout");
  });
}).then(res => console.log(res))
console.log("同步");

// resolve before
// 同步
// success
// setTimeout
```

`reject()` 会抛出一个错误，并且这个错误不能被 `try/catch` 捕获到，只能由拒绝处理程序捕获。这是因为错误信息没有被抛出到正在执行同步代码的线程里。

```js
try {
	throw new Error('foo');
} catch(e) {
	console.log(e); // Error: foo
}

// 当执行到 Promise.reject() 时，它会被放入异步任务队列中执行，
// 它的异常在事件循环中发生，所以不能被 try catch 捕获到
try {
	Promise.reject("error");
} catch(e) {
	console.log(e);	// 无法捕获
}
// Uncaught (in promise) error

// 使用 await 可以捕获 reject 错误
async function f() {
    try {
        await Promise.reject('出错了');
    } catch (e) {
        console.log(e);
    }
}
f(); // 在 catch 中捕获到错误
```

## 处理返回数据

我们可以通过下面这几个*期约的实例方法*来访问异步操作返回的数据。

***then() 方法***

 then() 方法接受两个可选的参数，分别是 resolve 和 reject 后对应的处理程序，会在 Promise 转化为对应状态后执行。

 ```js
function onResolved(id) {
	setTimeout(console.log, 0, id, 'resolved');
}

function onRejected(id) {
	setTimeout(console.log, 0, id, 'rejected');
}

let p1 = new Promise((resolve, reject) => setTimeout(resolve, 3000));
let p2 = new Promise((resolve, reject) => setTimeout(reject, 3000));

p1.then(() => onResolved('p1'), () => onRejected('p1'));
p2.then(() => onResolved('p2'), () => onRejected('p2'));

//（3 秒后）
// p1 resolved
// p2 rejected
 ```

then() 方法会返回一个新的 Promise 实例，这个实例基于 resolve 处理程序的返回值进行构建，即就是会通过 Promise.resolve(xxx) 包装来生成新期约。如果没有提供这个 resolve 处理程序，则 Promise.resolve() 就会包装上一个期约 resolve 之后的值。如果没有显式的返回语句，则 Promise.resolve() 会包装默认的返回值 undefined。

关于**执行顺序**：在一个期约上调用 then() 会把 resolve 处理程序推进任务队列。但这个处理程序在当前线程上的同步代码执行完成之前不会被执行。

***catch() 方法***

catch() 方法用于为 Promise 添加 reject 处理程序，是一个语法糖，相当于调用 then(null, onRejected)。

***finally() 方法***

为 Promise 添加 onFinally 处理程序，无论 Promise 转换为 resolved 还是 rejected，都会执行，但在其中无法知道 Promise 的状态是 resolved 还是 rejected，主要用于添加清理代码。

无论是 then()、catch() 还是 finally()，如果添加多个处理程序，当 Promise 状态发生改变时，会按照添加的顺序依次执行。

```js
let p1 = Promise.resolve();
p1.then(() => setTimeout(console.log, 0, 1));
p1.then(() => setTimeout(console.log, 0, 2));
// 1
// 2
```

***解决值、拒绝理由***

Promise 维护了两个内部变量，即*解决值*(value) 和*拒绝理由*(reson)，可以提供给对应的处理程序。

```js
let p1 = new Promise((resolve, reject) => resolve('foo'));
p1.then((value) => console.log(value)); // foo

let p2 = new Promise((resolve, reject) => reject('bar'));
p2.catch((reason) => console.log(reason)); // bar
```

### 期约连锁

目的：**串行化异步方法**，解决了回调地狱的问题。

```js
let p1 = new Promise((resolve, reject) => {
	console.log('p1 executor');
	setTimeout(resolve, 1000);
});

p1.then(() => new Promise((resolve, reject) => {
	console.log('p2 executor');
	setTimeout(resolve, 1000);
}))
.then(() => new Promise((resolve, reject) => {
	console.log('p3 executor');
	setTimeout(resolve, 1000);
}))
.then(() => new Promise((resolve, reject) => {
	console.log('p4 executor');
	setTimeout(resolve, 1000);
}));
// p1 executor（1 秒后）
// p2 executor（2 秒后）
// p3 executor（3 秒后）
// p4 executor（4 秒后）
```

### 期约合成

Promise 还有几个静态方法：`all()`、`any()`、`allSettled()`、`race()` 用于将多个期约进行合成。

`Promise.all()` 静态方法创建的期约会在一组期约全部 resolve 后再转到相应处理程序，该方法接收一个可迭代的对象。

```js
let p = Promise.all([
	Promise.resolve(), 
	new Promise((resolve, reject) => setTimeout(resolve, 1000))
]);
setTimeout(console.log, 0, p); // Promise <pending>
p.then(() => setTimeout(console.log, 0, 'all() resolved!'));
// all() resolved!（大约 1 秒后）
```

如果包含一个待定的期约，则合成的期约也处于待定状态；如果包含一个拒绝的期约，则合成的期约也会转换为拒绝状态；如果所有期约都成功解决，则合成期约的解决值就是所有包含期约解决值的数组。

```js
let p = Promise.all([
	Promise.resolve(3),
	Promise.resolve(),
	Promise.resolve(4)
]);
p.then((values) => setTimeout(console.log, 0, values)); 
// [3, undefined, 4]
```

如果有期约拒绝，则第一个拒绝的期约会将自己的理由作为合成期约的拒绝理由。之后再拒绝的期约不会影响最终期约的拒绝理由。不过，这并不影响所有包含期约正常的拒绝操作。合成的期约会静默处理所有包含期约的拒绝操作。

`Promise.any()` 只要有一个期约 resolve 则返回 resolve，否则为 reject。

`Promise.allSettled()` 当所有期约都兑现时返回，不论是解决还是拒绝。

`Promise.race()` 当最快的一个期约兑现时返回，不论是解决还是拒绝。

```js
let p1 = Promise.race([
	Promise.resolve(3),
	new Promise((resolve, reject) => setTimeout(reject, 1000))
]);
setTimeout(console.log, 0, p1); // Promise <resolved>: 3
```

如果有一个期约拒绝，只要它是第一个落定的，就会成为拒绝合成期约的理由。之后再拒绝的期约不会影响最终期约的拒绝理由。不过，这并不影响所有包含期约正常的拒绝操作。与 Promise.all() 类似，合成的期约会静默处理所有包含期约的拒绝操作。

---
title: 'JavaScript语法小结'
categories: ''
description: ''
order: 0
date: 2022-11
---

## Overview

JS 最早是为了用于前端表单校验，减轻服务器压力，提升用户体验，后来逐渐发展成了一门独立的客户端脚本语言。

JavaScript 在 1995 年由 Netscape 公司的 Brendan Eich 开发，最初名叫 Mocha，后与 SUN 公司合作开发，为了借借 Java 的名头，更名为 JavaScript。 1996 年 Netscape 将 JS 提交到 ECMA（欧洲计算机制造商协会） 组织进行标准化，于 1997 年被采纳，制定了 ECMAScript 标准，统一了客户端脚本语言。

标准包含的内容范围较小，而 JavaScript 等是对 ECMAScript 标准的实现，除了包含 ECMAScript 还包含了其他功能。

## script 标签

\<scrit> 标签用于在 HTML 中引入 JavaScript，按照引用方式，有**行内脚本**和**外部脚本**之分。如果两者混用，浏览器会忽视行内脚本，只加载并执行外部脚本。使用外部脚本易于维护，并且可以使用到浏览器的缓存。

### 8 个属性

| 属性       | 说明                                              | 备注           |
| ---------- | ------------------------------------------------- | -------------- |
| async      | 异步执行脚本                                      | 只针对外部脚本 |
| charset    | 指定字符集                                        | 几乎不使用     |
| crossorign | 跨域配置                                          | 默认不使用     |
| defer      | 表示脚本可以延迟到文档被完全解析额显示之后再执行  | 只针对外部脚本 |
| integrity  | 资源的签名                                        | 可选           |
| language   | 起初用于区分代码块中的脚本语言                    | 废弃           |
| src        | 外部脚本位置                                      |                |
| type       | 代替 language 表示代码块中的脚本类型（MIME 类型） | text/javascript               |

### 说明

***标签放置位置***

由于浏览器对 HTML 、JavaScript 是按顺序逐行解析的，故将 script 标签放置在 body 末尾比较合适，一般习惯于放在 head 标签内，会阻塞页面的渲染。

***延迟执行脚本***

async 和 defer 都可以达到延迟执行脚本的目的，防止页面阻塞，主要区别在于：defer 表示脚本可以延迟到整个页面渲染完毕后执行，多个 defer 之间执行顺序是确定的；async 表示当前脚本的加载执行可以不阻塞页面渲染和其他脚本的执行，多个 async 执行顺序不一定按照书写顺序。

## 声明变量

***var***

var 的作用域时函数作用域，在函数体外使用 var 可以声明一个全局变量，该变量会作为 window 对象的属性。

在函数中使用 var 声明一个变量，属于局部变量，随着函数的返回而销毁，但如果在函数内部直接使用一个变量，而没有 var 关键字修饰，则属于全局变量，当第一次调用该函数时，就会定义此变量，并在函数外部可以访问到。

```JavaScript
function test() {
	var message = "hi"; // 局部变量
	msg = "hi"; 		// 全局变量
}
test();
console.log(message); // error
console.log(msg); 	  // "hi"
```

***声明提升***

使用 var 声明的变量，其声明会自动提升到函数作用于顶部，如下面的代码将不会报错。注意：知识声明提升了，赋值操作没有提升。

使用 var 多次声明一个相同的变量，也没有任何问题。

```js
function foo() {
	console. log (age); // undefined 而不是 26
	var age = 26;
}
```

***let***

let 和 var 相比，其作用域是块作用域，并且没有声明提升一说，在同一个作用域中不能进行重复声明。但可以嵌套声明，如：

```js
let age = 30;
if (true) {
	let age = 26;
	console.log(age); // 26
}
console.log(age); // 30

var age2 = 30;
if (true) {
	var age2 = 26;
	console.log(age2); // 26
}
console.log(age2); // 26
```

在全局作用域中使用 let 进行变量声明，该变量将作为全局变量存在，但不会称为 window 对象的属性。

***const***

const 与 let 基本相同，唯一区别是，const 必须在声明的同时进行初始化，并且引用不可改变。

***迭代***

```js
// 在 let 出现之前，for 循环定义的迭代变量会渗透到循环体外部
for (var i = 0; i < 5; ++i) {
// ...
}
console.log(i); // 5

// 使用 let 后
for (let i = 0; i < 5; ++i) {
// ...
}
console.log(i); // ReferenceError
```

每次迭代，var 使用的是同一个变量，而 let 使用的是不同的变量。通过下面的代码就可以验证：

```js
for (var i = 0; i < 5; ++i) {
	setTimeout(() => console.log(i), 0)
} // 5 5 5 5 5

for (let i = 0; i < 5; ++i) {
	setTimeout(() => console.log(i), 0)
} // 0 1 2 3 4
```

## 原始数据类型

使用 `typeof` 操作符可以判断变量的数据类型，JS 中有七种基本的数据类型，分别是：Undefined、Boolean、String、Number、Object、Function、Symbol。

### Undefined

当使用 var 或 let 声明了一个变量但没有初始化时，值就为 undefined，对应的 boolean 值为 false，因此检测是否为 undefined 时，不必使用 `foo == undefined` 来判断。

***Null***

区别于 undefined，null 表示空对象，因此 typeof 空对象会返回 object。undefined 是由 null 派生而来的，因此使用 `null == undefined` 会返回 true。

### Boolean

只有两个值 true 和 false。不同类型转换为 Boolean 对应值如下表：

| 数据类型  | 对应 true  | 对应 false |
| --------- | ---------- | ---------- |
| String    | 非空字符串 | 空字符串   |
| Number    | 非零数值   | 0、NaN     |
| Object    | 任意对象   | null       |
| Undefined | 无         | undefined  |

### Number

***NaN***

NaN 表示 Not a Number，当原本要返回数值的操作失败了，就会返回 NaN。例如：

```js
console.log(0/0); // NaN
console.log(-0/+0); // NaN
console.log(5/0); // Infinity
console.log(5/-0); // -Infinity
// 注意：js 中有 +0、-0，但其意义相同。
```

任何类型和 NaN 运算的结果都是 NaN，并且 NaN 六亲不认，`NaN === NaN` 返回 false。

***数值转换***

`Number()` 函数转换规则如下：

- true 为 1，false 为 0；
- null 为 0；
- undefined 为 NaN；
- String
	- 符合正负、十进制、八进制、十六进制、浮点数格式的，转换为相应数值类型；
	- 空字符串转换为 0；
	- 除此之外，转换为 NaN。
- Object，调用 valueOf() 方法，并按照上述规则转换返回的值。如果转换结果是 NaN，则调用 toString() 方法，再按照转换字符串的规则转换。

`parseInt()` 方法会从第一个非空格字符开始转换，如果开头第一个字符不匹配或是空字符串会返回 NaN，匹配直到字符串末尾或第一个不满足要求的字符结束。

### String

ES6 新增了模板字面量，使用反单引号将可以保留换行字符，可以跨行定义字符串。在模板字面量中可以使用插值语法（${ key }）。

### Symbol

#todo  
[JS 中的 Symbol 是什么？ - 知乎](https://zhuanlan.zhihu.com/p/22652486)

### Object

引用类型，是一组数据和功能的集合。

***对象的创建***

```js
// 1. 直接创建，键值对的形式
var person={
	firstname : "k",
	lastname  : "hy",
	id        : 1234，
	talk : function(){ 
		return this.firstname+this.lastname+this.id;
	}
};
// 调用属性的两种方式
name=person.lastname;
name=person["lastname"];
// 调用方法要加括号
name=person.talk(); 
name=person["talk"]();

// 构造方法创建
function Person(firstname,lastname,id)
{
    this.firstname=firstname;
    this.lastname=lastname;
    this.id=id;
	
	this.getId = function getId(){
		return this.id;
	}
}
var p1 = new Person("Li","Si",2345);
```

***关于 this***

- this 写在谁的作用域里面就指代谁
	- 对象方法中，this 指向调用它的对象；
	- 函数中，this 指向函数的所属者（浏览器就是 window 对象）；
	- 其他情况，this 指向全局对象 （ Global，浏览器中就是 window 对象）；
		- 严格模式下是 undefined；
	- 在 HTML 事件中，this 指向了发出事件的 HTML 元素（事件源）；
- 注意：
	- 匿名函数中的 this，一般指向全局对象；
	- 箭头函数中的 this，指向函数的所属者，一般就是调用者；
		- 这就是为什么回调函数推荐用箭头函数，不需要在外面 `let _this = this` 获取 this 引用。

看下面两段代码。

```js
var name = "The Window";
var object = {  
  name : "My Object",
  getNameFunc : function(){  
	return function(){  
	  return this.name;  
	};
  }
};
alert(object.getNameFunc()());	// The Window


var name = "The Window";
var object = {  
  name : "My Object",
  getNameFunc : function(){ 
    var that = this;
    return function(){  
  	  return that.name;  
    };
  }
};
alert(object.getNameFunc()());	// My Object
```

## 基本引用类型

引用类型 Object 是把数据和功能组织到一起的一种结构，并非是“类”。对象是某个特定引用类型的实例，通过 `new` 操作符与构造函数来创建。

### Date

***创建***

```js
// 当前日期和时间   
new Date()

// 指定从 1970 年 1 月 1 日至今的毫秒数
new Date(milliseconds)  

/*ES5 规定的应该支持的格式
1. 5/23/2019
2. May 23, 2019
3. Tue May 23 2019 00:00:00 GMT-0700
4. YYYY-MM-DDTHH:mm:ss.sssZ 例如：2019-05-23T00:00:00
*/
new Date(dateString) 
// 相当于
new Date(Date.parse(dateString)) 

new Date(year, month, day, hours, minutes, seconds, milliseconds)
// 相当于，其中年和月是必须的
new Date(Date.UTC(year, month, ...))
```

***常用方法***

- Date.parse() 将字符串转换为毫秒数，失败返回 NaN。
- Date.UTC() 将字符串转换为毫秒数，接收年月日时分秒毫秒作为参数，年月必须传递。
	- 注意：月份从 0 开始。
- Date.now() 返回当前的毫秒数。
- getFullYear() 获取年份。
- getMonth() 获取月份 0-11。
- getDate() 获取日期 1-31。
- ......
- getTime() 返回毫秒数。
- 日期格式化方法（这些方法的输出格式取决于浏览器的实现，故不可靠）
	- toDateString()
	- toTimeString()
	- toLocalString()
	- toLocaleDateString()
	- toLocaleTimeString()
	- toUTCString()

### RegExp

***创建***

```js
var reg = new RegExp("\\w+");
var reg = /\w+/;
var name = "zhangsan";
var flag = reg.test(name);
```

### Math

- 属于内置单例对象，通过 `Math.方法名` 调用。
    - abs(x) 绝对值
    - pow(x,y) 求 X<sup>y</sup>
    - random ( ) 返回 \[0, 1) 的随机数
    - max()、min() 求最值
    - round(x) 四舍五入
    - ……

### Global

属于内置单例对象，在浏览器中对应 window 对象，常用方法如下表：

| 函数                 | 说明                                                                        |
|:-------------------- |:--------------------------------------------------------------------------- |
| decodeURI()          | 解码 URI 为字符串                                                             |
| decodeURIComponent () | 解码范围更广 (包括特殊符号，冒号、斜杆、问好、井号等) 的 URI 为字符串                                                   |
| encodeURI()          | 把字符串编码为 URI                                                          |
| encodeURIComponent() | 把范围更广的字符串编码为 URI                                                |
| escape()             | 对字符串进行编码                                                            |
| unescape()           | 对由 escape() 编码的字符串进行解码                                          |
| eval()               | 计算 JavaScript 字符串，并把它作为脚本代码来执行                            |
| isFinite()           | 检查某个值是否为有穷大的数                                                  |
| isNaN()              | 检查某个值是否为 NaN                                                         |
| Number()             | 把对象的值转换为数字                                                        |
| parseFloat()         | 逐一解析一个字符串并返回一个浮点数直到不是数字停止                          |
| parseInt()           | 逐一解析一个字符串中的字符直到不是数字停止<br />开头就是非数字字符则转为 NaN |
| String()             | 把对象的值转换为字符串                                                      |

### Map

属于 ES6 新特性，ES6 之前使用 Object 实现类似 Map 的功能，在涉及到大量 Map 操作时，可以选择使用 Map。

JS 的 Map 是有序的，键值可以使用任意类型，不一定非是 String。

***常用方法***

- has() 判断是否存在某键
- get() 根据键获取值
- set() 设置键值对
- size() 返回 map 的尺寸
- delete() 删除指定键值对
- clear() 清空所有键值对

### Set

***常用方法***

- add()
- has()
- size()
- delete()
- clear()

### Array

#todo

## DOM

![[_resources/attachment/eb801639-307d-46be-95d1-00ef53cbbad8.png]]

DOM（Document Object Model），文档对象模型。将文档的各个部分封装成为对象，使用这些对象可以动态的对文档的元素、属性、样式等进行操作。

 DOM 包含 document 对象、element 对象、attribute 对象、text 对象……这些对象都被看做是一个个节点，父子关系就对应着 html 文件中的标签及属性，例如 tr 是 td 的父节点，href 是 a 标签的一个子节点。

 可以通过 `appendChild()` 来添加节点，`removeChild()` 来删除节点，属性 `parentNode` 来获取父节点。

***element（标签）对象的方法***

| 方法                     | 说明                     |
| ------------------------ | ------------------------ |
| getElementById()         | 根据 id 属性获取，要唯一 |
| getElementsByTagName()   | 根据元素（标签）名获取   |
| getElementsByClassName() | 根据 class 属性获取      |
| getElementsByName()      | 根据 name 属性获取       |
| setAttribute()           | 设置属性                 |
| removeAttribute()        | 删除属性                 |

```js
var x = document.getElementById("test01");
```

***创建节点对象的方法***

| 方法                  | 说明             |
| --------------------- | ---------------- |
| createElement()       | 创建一个标签对象 |
| createAttribute(name) | 创建一个属性对象 |
| createTextNode()      | 创建一个文本对象 |

***DOM HTML 与 DOM CSS 属性***

innerHTML 属性

```js
  document.getElementById("p1").innerHTML="文本";
```

style 属性

```js
  document.getElementById('id1').style.color='red'
```

## BOM

BOM（Browser Object Model），浏览器对象模型。将浏览器的各个部分封装成为对象，拥有一些属性和方法，便于我们与浏览器“交流”，主要包含下面几个对象：

| 对象       | 说明                                          |
| ---------- | --------------------------------------------- |
| Navigator  | 浏览器对象，包含有关浏览器的信息              |
| Screen     | 显示器对象，包含有关用户屏幕的信息            |
| Window | 窗口对象，可以用来获取其他对象（包括 DOM 对象） |
| History    | 历史记录对象，包含用户在当前窗口访问过的 URL  |
| Location   | 地址栏对象，包含有关当前 URL 的信息           |

***window 对象***

常用属性（获取其他对象）

| 属性      | 说明             |
| --------- | ---------------- |
| navigator | 获取浏览器对象   |
| screen    | 获取屏幕对象     |
| history   | 获取历史记录对象 |
| location  | 获取地址栏对象   |
| document  | 获取 dom 对象      |

常用方法

| 方法                         | 描述                                             |
| :--------------------------- | :----------------------------------------------- |
| alert()                      | 显示带有一段消息和一个确认按钮的警告框           |
| confirm()                    | 显示带有一段消息以及确认按钮和取消按钮的对话框   |
| prompt()                     | 显示可提示用户输入的对话框                       |
| open()                       | 打开一个新的浏览器窗口，可以传一个 url            |
| close()                      | 关闭当前浏览器窗口，谁调用关谁                   |
| setInterval(方法 str，毫秒值) | 按照指定的周期（以毫秒计）来调用函数或计算表达式 |
| setTimeout(方法 str，毫秒值)  | 在指定的毫秒数后调用函数或计算表达式             |
| clearInterval()              | 取消由 setInterval() 设置的 timeout              |
| clearTimeout()               | 取消由 setTimeout() 方法设置的 timeout           |

***history 对象***

常用属性

| 属性   | 说明                           |
| :----- | :----------------------------- |
| length | 返回当前窗口历史列表中的网址数 |

常用方法

| 方法      | 说明                            |
| :-------- | :------------------------------ |
| back()    | 加载 history 列表中的前一个 URL |
| forward() | 加载 history 列表中的下一个 URL |
| go()      | 前进后退具体个数的历史页面      |

***location 对象***

常用属性

| 属性     | 描述                          |
| :------- | :---------------------------- |
| hash     | 返回一个 URL 的锚部分           |
| host     | 返回一个 URL 的主机名和端口     |
| hostname | 返回 URL 的主机名               |
| href     | 返回完整的 URL                 |
| pathname | 返回 URL 路径名                 |
| port     | 返回一个 URL 服务器使用的端口号 |
| protocol | 返回一个 URL 协议               |
| search   | 返回一个 URL 的查询部分         |

常用方法

| 方法      | 说明                                     |
| :-------- | :--------------------------------------- |
| assign()  | 载入一个新的文档，可以后退到上一页       |
| reload()  | 重新载入当前文档                         |
| replace() | 用新的文档替换当前文档，不能后退到上一页 |

## 函数

### 创建方式

```js
// 函数声明会被提升
function 函数名(var1,var2...){
    // 函数体
    // return xxx;
    // return后面的代码不会执行；
}
var 函数名 = function(var1,var2...){
    //函数体
}

// 使用 let 函数声明不会提升
let 函数名 = function(var1,var2...){
    //函数体
}
```

- 注意：
  - 函数实际是一个**Function**对象，重名方法会被覆盖重写，**没有重载**一说。
  - 方法的定义不用写参数类型也不用写返回类型。
  - 每个函数内都内置了一个*类数组*对象**arguments**，封装了传进来的参数。
- 函数 VS 方法：方法特指我们自己创建的对象中的函数，通过 `对象.方法名` 调用 （ 函数其实也是 window 对象的方法。

***参数问题***

JS 函数参数列表不关心传递的参数类型和个数，传递的参数个数少于或多于定义的参数列表都没有关系，因为内部维护了一个类数组的 arguments 对象，在函数内部可以使用 `arguments[i]` 来调用。这也是为什么没有重载，因为无法根据参数列表来区分同名的函数。

```js
function sayHi(name, message) {
	console.log("Hello " + name + ", " + message);
}
// 可以替换为
function sayHi() {
	console.log("Hello " + arguments[0] + ", " + arguments[1]);
}
```

在箭头函数中无法直接使用 arguments 对象，但可以通过函数包装一层来访问。

```js
function foo() {
	let bar = () => {
		console.log(arguments[0]); // 5
	};
	bar();
}
foo(5);
```

### 闭包

**闭包**指的是**引用了另一个函数作用域中变量的函数**，通常是在嵌套函数中实现的。

使用闭包的**目的**是：在不使用全局变量的条件下，让某些局部变量的值驻留到内存中，并且可以被访问的到。

闭包的**本质**是链接内层函数和外层函数的桥梁。

要理解闭包首先要理解作用域链。

***作用域链***

JS 中每个上下文都关联了一个对象，称为*变量对象*，该上下文所定义的所有变量和函数都存在于这个变量对象上。*全局上下文*的变量对象就是 Global，在浏览器中就是 window 对象。每个函数调用都有各自的上下文，当进入某个函数时，其上下文被推到一个*上下文栈*中，当函数执行完毕后，上下文栈弹出该上下文，将控制权返还给之前的执行上下文。

代码执行过程中，会创建变量对象的一个*作用域链*，位于**作用域链顶端**的是当前正在执行的上下文对应的变量对象，如果正在执行某函数，则其*活动对象*就是变量对象，即就是 arguments。和上下文栈的出栈顺序对应，作用域链的下一节点是上一层上下文对应的变量对象，以此类推直到全局上下文对应的变量对象。

代码执行时标识符解析就是沿着作用域链逐层搜索，若没有找到，则报错。大白话就是子对象可以访问到父对象中的变量和函数。

***一个简单的例子***

```js
function f1() {
	var n=0;
	return function() {
		console.log(n++);
	};
}
var f2 = f1();
f2(); // 0
f2(); // 1
f2(); // 2

f2 = null; // 用完了要置为 null，让垃圾回收器回收，否则会造成内存泄漏。
```

***参考资料***

[学习Javascript闭包（Closure） - 阮一峰的网络日志 (ruanyifeng.com)](https://www.ruanyifeng.com/blog/2009/08/learning_javascript_closures.html)

### 立即调用函数

```js
// 格式如下，相当于直接调用一次匿名函数
(function() {
	// 块级作用域
})();

// 防止 i 外泄，使用立即调用函数的写法
(function () {
	for (var i = 0; i < count; i++) {
		console.log(i);
	}
})();
console.log(i); // 访问不到
```

立即调用函数是在 ES6 之前用于模拟块级作用域而使用的，有了 ES6 之后，无需再使用。

## 期约 Promise

前往：[[FrontEnd/Promise|Promise]]

## 面向对象

### 对象及其属性

对象其实就是一个 hashMap，值可以为数据或函数。下面两种创建对象的方法是等价的。

```js
// new 方式
let person = new Object(); 
person.name = "Nicholas"; 
person.age = 29; 
person.job = "Software Engineer"; 
person.sayName = function() { 
	console.log(this.name); 
};

// 对象字面量方式
let person = { 
 name: "Nicholas", 
 age: 29, 
 job: "Software Engineer", 
 sayName() { 
 console.log(this.name); 
 } 
}; 
```

对象的属性分为两种：*数据属性*和*访问器属性*。数据属性就是普通的变量，访问器属性就是 get、set 方法。他们分别有着不同的**内部特性**来描述他们的行为，这些特性一般不能直接访问，打印对象时，通常可以看到双中括号，如 \[\[Enumerable\]\]，这就是描述属性行为的特性。

***数据属性***

| 特性                 | 说明                                                   |
| -------------------- | ------------------------------------------------------ |
| \[\[Configurable\]\] | 表示属性是否可以通过 delete 删除，是否可以修改他的特性 |
| \[\[Enumerable\]\]   | 表示属性是否可以通过 for-in 循环返回                   |
| \[\[Writable\]\]     | 表示属性的值是否可以被修改                             |
| \[\[Value\]\]        | 存放属性的实际值                                       |

可以使用 `Object.defineProperty()方法` 来设置属性的特性。

```js
let person = {}; 
Object.defineProperty(person, "name", { 
 writable: false, 	// 只读
 value: "Nicholas" 
}); 
console.log(person.name); // "Nicholas" 
person.name = "Greg"; // 非严格模式下静默失败
console.log(person.name); // "Nicholas"
```

另外需要注意，当把 configurable 置为 false 后，就不能再企图置为 true 让它还原为可配置的了。

```js
let person = {}; 
Object.defineProperty(person, "name", { 
 configurable: false, 
 value: "Nicholas" 
}); 
console.log(person.name); // "Nicholas" 
delete person.name; 	// 非严格模式下静默失败
console.log(person.name); // "Nicholas" 
```

在调用 Object.defineProperty() 时，configurable、enumerable 和 writable 的值如果不 指定，则都默认为 false。

***访问器属性***

| 特性                 | 说明                                                   |
| -------------------- | ------------------------------------------------------ |
| \[\[Configurable\]\] | 表示属性是否可以通过 delete 删除，是否可以修改他的特性 |
| \[\[Enumerable\]\]   | 表示属性是否可以通过 for-in 循环返回                   |
| \[\[Get\]\]          | 在读取属性时调用，默认 undefined                       |
| \[\[Set\]\]          | 在写入属性时调用，默认 undefined                       |

```js
Object.defineProperty(bar, "foo", { 
 get() {}, 
 set(newValue) {} 
}); 
```

### 构造函数和原型

***工厂函数和构造函数***

1. 通过普通函数创建对象，缺点是无法确定对象的类型 instance of 均返回 Object。

```js
function createPerson(name, age, job) { 
 let o = new Object(); 
 o.name = name; 
 o.age = age; 
 o.job = job; 
 o.sayName = function() { 
   console.log(this.name); 
 }; 
 return o; 
} 
let person1 = createPerson("Nicholas", 29, "Software Engineer"); 
let person2 = createPerson("Greg", 27, "Doctor"); 
console.log(person1 instanceof Object); // true 
console.log(person1 instanceof createPerson); // false
```

2. 通过构造函数创建对象，解决了对象标识问题。

```js
function Person(name, age, job){ 
 this.name = name; 
 this.age = age; 
 this.job = job; 
 this.sayName = function() { 
   console.log(this.name); 
 }; 
} 
let person1 = new Person("Nicholas", 29, "Software Engineer"); 
let person2 = new Person("Greg", 27, "Doctor"); 
person1.sayName(); // Nicholas 
person2.sayName(); // Greg
console.log(person1 instanceof Object); // true 
console.log(person1 instanceof Person); // true 
console.log(person2 instanceof Object); // true 
console.log(person2 instanceof Person); // true 
```

构造函数也是函数，区别在于调用方式，构造函数使用 `new` 调用，会发生如下过程：

1. 在内存中创建一个新对象；
2. 这个新对象内部的\[\[Prototype]] 特性被赋值为构造函数的 prototype 属性；
3. 构造函数内部的 this 被赋值为新对象；
4. 执行构造函数内的代码；
5. 如果构造函数 return 了非空对象，则返回 return 的对象，否则返回刚刚构造好的对象。

通过构造方法创建对象也存在着问题，如上面的 person1 和 person2 都会有各自 sayName 方法，相当于在内存中创建了两份。要解决这个问题，我们可以将需要共享的函数抽取出来，在构造方法中将该函数的引用传递给对象的属性方法，以达到多个对象的属性方法是一个实例。

```js
function Person(name, age, job){ 
 this.name = name; 
 this.age = age; 
 this.job = job; 
 this.sayName = sayName; // 看这里
} 
function sayName() { 
 console.log(this.name); 
} 
let person1 = new Person("Nicholas", 29, "Software Engineer"); 
let person2 = new Person("Greg", 27, "Doctor"); 
person1.sayName(); // Nicholas 
person2.sayName(); // Greg
```

这样做虽然解决了共享的问题，但是代码不好组织，这就要通过原型来解决了。

***原型***

```js
function Person() {} 

Person.prototype.name = "Nicholas"; 
Person.prototype.age = 29; 
Person.prototype.job = "Software Engineer"; 
Person.prototype.sayName = function() { 
 console.log(this.name); 
}; 

let person1 = new Person(); 
person1.sayName(); // "Nicholas" 
let person2 = new Person(); 
person2.sayName(); // "Nicholas" 
console.log(person1.sayName == person2.sayName); // true
```

1. 每个函数创建后，内部都会关联一个 prototype 属性，指向原型对象；
2. 每一个原型对象会包含一个 constructor 属性，指向与之关联的构造函数；
	- 即 `Object.prototype.constructor == Object`；
3. 每一个对象实例内部的\[\[Prototype]] 特性也指向原型对象；
	- 一般浏览器通过暴漏 `__proto__` 属性来访问，即 `Object.prototype == o.__proto__`

三者的关系如图所示。

![[_resources/attachment/65d85b2b-0fb1-4139-8e13-1ad81d98dbaa.png]]

不同的实例对象可以共享原型中的属性，如果实例对象中声明了和原型中相同名称的属性，则会进行覆盖隐藏。可以使用 `hasOwnpProperty()` 方法来确定某个属性是实例的还是原型对象的。

需要注意的是，原型也是一个对象，当使用字面量的方式修改构造函数的原型时，会打乱指针的指向，原型的 constructor 属性将不再指向原来的构造函数，除非显式的指明。如下代码所示。

```js
function Person() {} 
Person.prototype = {
  constructor: Person, // 需要在这里指明
  name: "Nicholas", 
  age: 29, 
  job: "Software Engineer", 
  sayName() { 
    console.log(this.name); 
  } 
}; 

// 通常还需要恢复 constructor 的 enumerable 特性为 false
Object.defineProperty(Person.prototype, "constructor", { 
  enumerable: false, 
  value: Person 
}); 
```

### 继承

JS 中的继承就使用到了原型，称为*原型链*。本质是让子类的原型指向父类的实例，即子类对象原型的原型就指向了父类原型，这就是原型链。

代码实现如下。

```js
function SuperType() { 
  this.property = true; 
} 
SuperType.prototype.getSuperValue = function() { 
  return this.property; 
}; 

function SubType() { 
  this.subproperty = false; 
} 
// 继承 SuperType,子类原型指向父类实例
SubType.prototype = new SuperType(); 
SubType.prototype.getSubValue = function () {
  return this.subproperty; 
}; 
let instance = new SubType(); 
console.log(instance.getSuperValue()); // true
```

指向关系如下图。

![[_resources/attachment/8321da6f-2431-4417-90ea-821dbba61779.png]]

需要注意的是，子类原型指向父类实例，则子类实例的 `__proto__` 属性都指向了这个父类实例，父类实例中的属性，就相当于是子类的原型属性，是子类实例所共享的。

这不是 JS 继承的最佳实践，比如上面提到的问题，怎么解决不在这儿记了，非前端不太用得上。关键词：盗用构造函数、组合继承、原型继承、寄生继承、寄生组合继承。

## 事件

> JavaScript 与 HTML 的交互是通过事件实现的，事件代表文档或浏览器窗口中某个有意义的时刻。可以使用仅在事件发生时执行的监听器（也叫处理程序）订阅事件。在传统软件工程领域，这个模型叫“观察者模式”，其能够做到页面行为（在 JavaScript 中定义）与页面展示（在 HTML 和 CSS 中定义）的分离。

### 事件流

由于 HTML 是嵌套的，故当点击了页面上的某个按钮后，同时还点击了它的父容器，乃至于整个页面。这就有了*事件流*的概念。

```js
<!DOCTYPE html>
<html>
<head>
	<title>Event Bubbling Example</title>
</head>
	<body>
		<div id="myDiv">Click Me</div>
	</body>
</html>
```

在点击页面中的\<div>元素后，click 事件会以如下顺序发生，称为*事件冒泡*。现代浏览器中的事件会一直冒泡到 window 对象。

![[_resources/attachment/ba666ee8-4ff8-4f1c-adea-d73a18600c9f.png]]

除此之外，还有*事件捕获*的概念，指在事件到达最终目标前拦截事件，点击页面中的\<div>元素后，click 事件会以如下顺序发生。

![[_resources/attachment/bbe79df8-05d1-49d8-837b-5be741c1c883.png]]

大多数情况下，事件处理程序会被添加到事件流的冒泡阶段，主要原因是跨浏览器兼容性好。把事件处理程序注册到捕获阶段通常用于在事件到达其指定目标之前拦截事件。如果不需要拦截，则不要使用事件捕获。

### 事件处理程序

有几种添加事件处理程序的规范，如下。

***HTML 添加事件处理程序***

1. 可以在行内添加，引号内直接写要执行的 JS 代码，但是要注意需要将 HTML 关键字进行转义，比如和号（&）、双引号（"）、小于号（<）和大于号（>）等。

```js
<input type="button" value="Click Me" onclick="console.log('Clicked')"/>
```

2. 还可以使用函数的方式添加，这样添加的缺点是当 JS 还没有被加载完成，但页面已经渲染出来时，点击按钮，会报错，一般使用 try/catch 解决。

```js
<script>
function showMessage() {
	console.log("Hello world!");
}
</script>
<input type="button" value="Click Me" onclick="showMessage()"/>
// 使用 try/catch 静默处理
<input type="button" value="Click Me" onclick="try{showMessage();}catch(ex) {}">
```

这样添加的事件处理程序，可以接收一个内部维护的特殊局部变量 `event`，即*事件对象*。特别的，事件处理程序中的 `this` 指代的是事件源，即发出事件的 DOM 对象。

***DOM0 添加事件处理程序***

通过对应的属性来添加事件处理函数。

```js
// 添加
let btn = document.getElementById("myBtn");
btn.onclick = function() {
	console.log("Clicked");
};

// 移除
btn.onclick = null;
```

***DOM2 添加事件处理程序***

即使用 `addEventListener()` 和 `removeEventListener()` 来添加和移除事件，他们接收 3 个参数，分别是：事件名、事件处理函数、1 个 bool 值。该 bool 值为 true 时表示在捕获阶段调用事件处理程序，为 false 时表示在冒泡阶段调用事件处理程序，默认为 false。

```js
let btn = document.getElementById("myBtn");
btn.addEventListener("click", () => {
	console.log(this.id);
}, false);
```

使用此方法添加事件处理函数的优点是，可以为同一个事件源添加多个事件处理函数，当事件触发时，会按照顺序依次执行。

在移除事件时，必须使用相同的参数列表，如果在注册事件处理程序时使用了匿名函数，则无法移除。

```js
let btn = document.getElementById("myBtn");
btn.addEventListener("click", () => {
	console.log(this.id);
}, false);

// 企图移除该事件处理程序，无效！
btn.removeEventListener("click", function() {
	console.log(this.id);
}, false);
```

### 事件对象

事件触发时，相关信息会被收集并存储在一个名为 event 的对象中，包含了事件源、事件类型以及特定事件特有的数据。例如鼠标事件的位置信息、键盘事件的按键信息等。

下面列出事件对象公有的一些属性和方法。

| 属性/方法                  | 说 明                                               |
| -------------------------- | --------------------------------------------------- |
| bubbles                    | 是否冒泡                                            |
| cancelable                 | 是否取消事件的默认行为                              |
| currentTarget              | 当前事件处理程序所在的元素                          |
| defaultPrevented           | true 表示已经调用 preventDefault()                  |
| detail                     | 事件相关的其他信息                                  |
| eventPhase                 | 1 代表捕获阶段，2 代表到达目标，3 代表冒泡阶段      |
| target                     | 事件目标                                            |
| trusted                    | true 表示事件由浏览器生成，false 表示由 JS 代码添加 |
| type                       | 被触发的事件类型                                    |
| View                       | 与事件相关的抽象视图，等同于 window 对象            |
| preventDefault()           | 取消事件的默认行为                                  |
| stopImmediatePropagation() | 取消后续所有捕获和冒泡，并阻止事件处理程序          |
| stopPropagation()          | 取消后续所有捕获和冒泡                                                    |

### 事件类型

- DOM3 Events 定义了如下事件类型。
	- 用户界面事件（UIEvent）：涉及与 BOM 交互的通用浏览器事件。
	- 焦点事件（FocusEvent）：在元素获得和失去焦点时触发。
	- 鼠标事件（MouseEvent）：使用鼠标在页面上执行某些操作时触发。
	- 滚轮事件（WheelEvent）：使用鼠标滚轮（或类似设备）时触发。
	- 输入事件（InputEvent）：向文档中输入文本时触发。
	- 键盘事件（KeyboardEvent）：使用键盘在页面上执行某些操作时触发。
	- 合成事件（CompositionEvent）：在使用某种 IME（Input Method Editor，输入法编辑器）输入字符时触发。

### 事件循环

***参考资料***

[Jake Archibald: In The Loop - JSConf.Asia - YouTube](https://www.youtube.com/watch?v=cCOL7MC4Pl0)

[搞懂JS的事件循环（Event Loop）和宏任务/微任务 - SegmentFault 思否](https://segmentfault.com/a/1190000040014996)

[JS为什么要区分微任务和宏任务？ - 知乎 (zhihu.com)](https://www.zhihu.com/question/316514618)  

[微任务、宏任务与Event-Loop - 掘金 (juejin.cn)](https://juejin.cn/post/6844903657264136200#heading-3)

## 模块化

ES6 之前，常用的有 AMD 和 CommonJS 模块化规范，但需要额外进行打包处理，才能被浏览器所支持。ES6 之后，支持 ES6 的浏览器可以原生的支持 JS 模块加载。下面只记录 ES6 模块化相关的概念和语法。

ES6 模块的特点：模块是单例的只加载一次；模块代码只在加载完成后执行；模块可以请求加载其他模块，支持循环依赖；默认在严格模式下执行；不共享全局命名空间；使用 var 声明的变量不会添加到 windows 对象中。

### script 标签引入模块

```js
// 嵌入模块
<script type="module"> 
 // 模块代码
</script> 

// 外部文件
<script type="module" src="path/to/myModule.js"></script> 
```

使用 `type="module"` 相当于给 `<script>` 标签添加了 `defer` 属性，所有的文件将立即异步加载，但会在文档解析完成后执行，多个模块的执行顺序按照书写顺序。若与此同时声明了 `async` 属性，则模块会立即异步加载，但不会等到文档解析完成后才执行，并且多个模块间的执行顺序与书写顺序不一定相同。

### 模块的导出

可以使用 `export` 控制模块的哪些部分对外部可见，支持*命名导出*和*默认导出*，分别对应着不同的导入方式。

注意：

- export 必须位于模块的顶级，如嵌套在 if 块中使用是不被允许的；
- export 导出对模块代码的执行没有影响，并且像 var 一样会被提升。

***命名导出***

```js
// 普通导出
const foo = 'foo';
export {foo};

// 行内导出
export const foo = 'foo';
export function foo() {}
export class Foo {}

// 别名导出
export {foo as foo2};

// 导出多个
export {foo as foo2, bar}
```

***默认导出***

使用 default 关键字声明为默认导出，每个模块只能有一个默认导出。

```js
const foo = 'foo';
export default foo;
export {foo as default};

// 命名导出和默认导出可以一起使用
export foo;
export default bar;
export {foo, bar as default}
```

### 模块的导入

注意：

- 同 export 一样，`import` 也必须位于模块的顶级，不允许嵌套；
- import 的参数不能是动态计算的结果，因为在解析模块依赖时，不会执行模块代码，只会静态分析；
- 浏览器原生加载模块，必须带 `.js` 扩展名，如果是使用一些构建工具，则可能不需要；
- 导入的模块是只读的，相当于 const 变量。

```js
const foo = 'foo', bar = 'bar', baz = 'baz'; 
export {foo, bar, baz} 
export default foo

// 对于命名导出，可以使用*来批量导入
import*as Foo from './foo.js';
console.log(Foo.foo); // foo 
console.log(Foo.bar); // bar 
console.log(Foo.baz); // baz

// 或指定名称导入
import { foo, bar, baz as myBaz } from './foo.js';
console.log(foo); // foo 
console.log(bar); // bar 
console.log(myBaz); // baz

// 对于默认导出
import { default as foo } from './foo.js'; 
import foo from './foo.js';

// 混合使用
import foo, { bar, baz } from './foo.js';
import { default as foo, bar, baz } from './foo.js';
import foo,*as Foo from './foo.js';
```

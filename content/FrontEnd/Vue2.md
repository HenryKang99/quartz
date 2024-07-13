---
title: 'Vue2'
categories: 'FrontEnd'
description: ''
order: 0
date: 2023-01
---

[参考coderwhy的Vue教程](https://www.bilibili.com/video/BV15741177Eh)

### 1. 基础语法

#### 1. v-for

![[_resources/attachment/9249ed7c-223b-4e76-9c28-ce44b55b2292.png]]

![[_resources/attachment/fef4b518-fa26-4dd2-800a-9cd36e56e774.png]]

![[_resources/attachment/479a388b-04d6-430a-930f-b8441b1b3374.png]]

![[_resources/attachment/2e6bdc52-f1ca-41fe-b361-0a2e79da9ac9.png]]

#### 2. @click 方法不加括号

![[_resources/attachment/8f1b5ec8-e06a-4f63-b04f-db9358b32af4.png]]

#### 3. mustache 语法

![[_resources/attachment/3294fe49-8301-4eb8-81a2-086e2e05f45d.png]]

#### 4. v-once 只渲染一次

![[_resources/attachment/33afc6e7-e06e-43ec-a748-b1756e210570.png]]

#### 5. v-html 解析 html

![[_resources/attachment/e869b76c-8cc9-4004-89c4-bcc62e0efc29.png]]

#### 6. v-text

![[_resources/attachment/8c2e102e-5c25-4a32-aaf2-49a3df10b3b6.png]]

#### 7. v-pre 不渲染它及其子元素

![[_resources/attachment/5cebd402-7cdc-4601-b4a6-f7888c33998b.png]]

#### 8. v-cloak 防止浏览器显示未编译的 mustache

![[_resources/attachment/98af95ab-bed0-4d29-9b68-81c54eba1a49.png]]

#### 9. v-bind 动态绑定属性

![[_resources/attachment/932630eb-97b4-415a-a76f-ca5dde2b3142.png]]

**语法糖：**

![[_resources/attachment/e7a6c1cf-e36e-4d7d-b369-2bcbb699803b.png]]

##### 9.1 动态绑定 class

1. **对象语法**

![[_resources/attachment/0a57ca59-a825-473e-af35-ecdf15e95e88.png]]

2. **数组语法**

![[_resources/attachment/3c92b16b-06e9-4abb-8973-38b6b73cf99c.png]]

##### 9.2 动态绑定 style

![[_resources/attachment/614df817-b4e5-4690-96f3-890d12ba57cd.png]]

![[_resources/attachment/95a5b2b9-7cdd-42a5-8400-b901ca457b93.png]]

#### 10. 计算属性

![[_resources/attachment/d3a0aab1-a4d5-48a1-a03a-07338861a826.png]]

![[_resources/attachment/259d9ecc-7d6c-49d7-95fe-adf0f663cfaa.png]]

#### 11. v-on 注意传参问题

![[_resources/attachment/89577d4d-bdfe-4ac2-87d4-9d4c262798c7.png]]

![[_resources/attachment/52c16c60-fd55-47a9-aa7f-9d4a8e66e260.png]]

#### 12. v-if、v-else-if、v-else

![[_resources/attachment/84886af8-b1e1-48e8-b3b0-41e3fea752b1.png]]

![[_resources/attachment/3c373efd-5a86-4cee-b394-f0507dcaecdf.png]]

![[_resources/attachment/1553a3d1-2ad5-4ca0-9b2c-eecc6a6b1409.png]]

#### 13. v-show

![[_resources/attachment/92b837b0-4825-4272-89e5-1bc97ec9d662.png]]

例如根据登录角色权限不同而渲染不同页面，就使用 v-if。

#### 14. v-model 双向绑定

![[_resources/attachment/fcc90717-e57c-41f3-a674-edb03ca4dcad.png]]

![[_resources/attachment/c5142e5c-1094-4184-9b35-9474bf301515.png]]

---

---

### 2. 组件化开发

#### 1. 过程：创建 - 注册 - 使用

##### 1. 创建与注册全局或局部组件

![[_resources/attachment/7b96ba01-9bda-43fb-ab21-b3384cea7771.png]]

##### 2. 模板分离写法

![[_resources/attachment/f9fbe4a8-110b-49d5-819e-89c825ec5a99.png]]

#### 2. 全局组件与局部组件

区别在于注册方式。

![[_resources/attachment/a5ed686c-1b0d-42ed-a6a7-0ecda74ee6af.png]]

#### 3. 父子组件问题

注意：下面这个例子中，vue 实例中不能直接使用子组件标签来引入子组件，因为子组件并没有在 vue 实例中注册，只注册进了父组件。子组件在注册进父组件时，就已经编译完成作为父组件的一部分了。

![[_resources/attachment/9a033a39-697d-4d1e-9e16-90c28e244342.png]]

#### 4. 组件的 data 域问题

注意：组件无法直接访问 vue 实例中的 data，因为组件也相当于一个 vue 实例，有自己的 data 域。并且 data 必须是一个函数，因为组件可能被多个地方引用，造成并发错误。

![[_resources/attachment/dcacf914-bef2-4dd4-9abb-7e550f9159ff.png]]

![[_resources/attachment/3f3752dd-71b4-4434-ae0f-3fe3abb88a8c.png]]

#### 5. 父子组件通信

##### 1. 父传子 props

![[_resources/attachment/efdfe54e-c121-490a-a2c2-8848771d86f4.png]]

##### 2. 子传父 event

![[_resources/attachment/edd9213e-c656-494b-a0f2-9c7edbf9b292.png]]

#### 6. 插槽 Slot

##### 1. 匿名插槽

如果传递了内容，\<slot>中的内容将被 **全部替换**，否则显示插槽定义时默认的内容。

![[_resources/attachment/ca474e07-3f9c-42df-a308-ece3ba8886e7.png]]

##### 2. 命名插槽

![[_resources/attachment/d08243e5-eca6-43c1-83f9-f691b892560c.png]]

##### 3. 编译作用域

![[_resources/attachment/6c1633ad-39e1-4864-8d61-89c1248a1d5b.png]]

##### 4. 作用域插槽

即在 Slot 上绑定一些数据，供给父组件直接使用。作用：子组件提供数据，父组件负责控制展示样式的时候可以使用。

![[_resources/attachment/4a92b479-0c7f-4baf-b7dd-3f6f327d49f0.png]]

![[_resources/attachment/08151711-84a2-4f01-abea-80b2eb0f8a85.png]]

---

---

### 3. 模块化开发

#### 1. 一些导入导出写法

![[_resources/attachment/61f941a8-e258-4dea-9886-b214a9ce60f6.png]]

![[_resources/attachment/15a5fc87-dbb8-4a7b-9594-933b9e63c9bc.png]]

![[_resources/attachment/2c6446af-4b65-41dc-a17a-60e9c1191e2f.png]]

![[_resources/attachment/a9aeaa95-ca1d-42ee-acd4-b7d0ba9e628e.png]]

#### 2. webpack

#### 3. Vue-Cli

----

---

### 4. vue-router

**本质：将路径和组件映射起来，路径的改变就是组件的切换。**

#### 4.1 入门

##### 4.1.1 两种模式

![[_resources/attachment/c814704f-b228-4e58-b54a-7548f8b7ae9b.png]]

![[_resources/attachment/15d80d24-0f21-4ac6-a3a9-1ecdb92c63f3.png]]

![[_resources/attachment/39df6ba9-9c80-4c39-a18b-eca98f2b5abd.png]]

![[_resources/attachment/53f41cf1-6f45-4dcb-a1b6-1046b106bb2e.png]]

##### 4.1.2 使用步骤

![[_resources/attachment/93246151-ac5d-4d7f-833a-ad501e632295.png]]

![[_resources/attachment/7121c8f4-c5ed-448d-a45f-db2ab5602184.png]]

![[_resources/attachment/467e108a-6b2d-4349-a798-1cfccb421eeb.png]]

![[_resources/attachment/14059e1f-e167-49d7-9eda-fd7ea313e6a6.png]]

![[_resources/attachment/d77e5e56-eebd-49cf-860f-67da6409f17b.png]]

![[_resources/attachment/a5dadb23-8e09-4ef7-a667-153673f94076.png]]

![[_resources/attachment/4f827dde-14cd-49af-b412-4b7b5a210456.png]]

##### 4.1.3 跳转时执行 JS 代码

![[_resources/attachment/39aaf932-bca4-4ac6-b43d-28e8377a7a18.png]]

#### 4.2 动态路由、懒加载

##### 4.2.1 动态路由

![[_resources/attachment/235a32d9-e512-465c-b105-593ee4076b17.png]]

传参：

```js
<router-link :to="{path: '/applicant/companyDetail/' + item.id}"></router-link>
```

##### 4.2.2 懒加载

![[_resources/attachment/d6105ea8-0921-4381-bfad-c0af3176e650.png]]

![[_resources/attachment/8cb89c98-84d6-4f7e-aa0b-2738b4580712.png]]

#### 4.3 路由嵌套

**注意：**

- `children[ ]` 内部的组件，path 不要带 `/`，否则 url 会映射到根路径。
- 在组件内部使用 `router-view` 标签。

![[_resources/attachment/77e99517-7596-4b1e-8194-59552dd1ec06.png]]

![[_resources/attachment/07e626a7-8afc-4ff3-bcbf-c46c61332dd3.png]]

#### 4.4 参数传递

##### 4.4.1 传递参数

![[_resources/attachment/448a263f-d739-4982-8a95-92c07d92b9c4.png]]

![[_resources/attachment/e1e6adf1-5a7e-45e0-ad6e-9c9bcd4e7afc.png]]

![[_resources/attachment/c7624291-8fbf-4e0f-af35-610779f1c9f5.png]]

##### 4.4.2 获取参数

$route 对象：封装了当前路由状态的信息。

![[_resources/attachment/a421b710-e34e-49db-ab08-be37c61dd9ca.png]]

![[_resources/attachment/411442f2-941a-461c-a1e6-7248a328254e.png]]

#### 4.5 导航守卫

**作用：用来监听路由状态的切换。**

如，在路由切换后，更改页面 title。

如果是 afterEach() 方法，不需要调用 next()。

![[_resources/attachment/23adcf45-2786-40a9-92a9-b3479e79af42.png]]

#### 4.6 keep-alive

![[_resources/attachment/31c95aeb-03bb-4187-ba4f-a5fadc4f825f.png]]

---

### 5. Vuex

**作用：响应式的状态管理，方便在多个组件间共享数据。**

![[_resources/attachment/96da49da-5c8c-4a32-bbc0-a2d83b27ffe2.png]]

![[_resources/attachment/a02cc8dd-799f-4942-b068-25c2164b18ec.png]]

![[_resources/attachment/608b8bdd-2749-45f0-85e4-1f6a3a7e9953.png]]

![[_resources/attachment/e3c306e3-42de-4e10-897a-0275a1044a2f.png]]

1. State

就是要共享的属性。

2. Getters

可以理解为计算属性。

3. Mutations

更新时使用提交 Mutations 的方式。

- 携带参数：

![[_resources/attachment/4c77fa08-005c-4075-b9a0-e5b1fa3ba283.png]]

- 两种提交风格

![[_resources/attachment/afc26001-05b6-454e-a33d-61b5abbacd0f.png]]

- 响应规则

![[_resources/attachment/670f0957-ecec-4087-ae6b-fa76bbc77f2a.png]]

4. Actions

![[_resources/attachment/03805d32-4045-4e6e-a3c4-f53155b8c04a.png]]

![[_resources/attachment/81578d26-5c51-480b-825f-661bbb63e770.png]]

5. Module

![[_resources/attachment/95b14405-4a7c-4ef8-9613-d36333db1834.png]]

![[_resources/attachment/1504a46d-cbf9-4ab2-a829-c40255433ad5.png]]

![[_resources/attachment/04ecec06-b767-4336-9a6b-924302517bd6.png]]

---

---

### 6. axios

#### 6.1 Promise

作用：ES6 中异步编程的一种解决方案，是 CommonJS 为异步编程设计得统一接口。

![[_resources/attachment/906b898c-172f-48ad-8ebf-2bd42997772c.png]]

![[_resources/attachment/85fd212c-3d1e-431e-9e31-01614b11abf0.png]]

![[_resources/attachment/af6bfccb-0253-4a75-ba39-1c66ef5b7a18.png]]

![[_resources/attachment/6b21444a-f00b-4643-a9e7-8761a15823e6.png]]

#### 6.2 axios

> 注意回调。

##### 1. 两种封装方式

**方式一：**传入回调方法，在封装体内部回调。

```js
import axios from 'axios'

//传入回调方法
export function request(config, success, failure) {
  //创建axios实例
  const instance = axios.create({
    baseURL: 'xxx',
    method: "get",
    timeout: 5000
  })
  //发送请求
  instance(config)
    .then(res => {
      success(res);
  })
    .catch(err => {
      failure(err);
  })
}

//---调用---
request({
    config: {},
    success: function(res){},
    failure: function(err){}
})
```

**方式二：**直接 return，因为 axios 返回的就是一个 promise。

```js
import axios from 'axios'

//可以给默认的axios实例设置default值
//注意只会在默认的axios实例生效
axios.defaults.baseURL = xxx;
axios.defaults.timeout = xxx;

var baseUrl = 'http://localhost/nqa';

export function get(config) {
  const get = axios.create({
    baseURL: this.baseURL,
    method: "get",
    timeout: 5000,
  })
  return get(config);
}

export function post(config) {
  const post = axios.create({
    baseURL: this.baseURL,
    method: "post",
    headers: {'Content-Type': 'application/json'},
    timeout: 5000
  })
  return post(config);
}
//---调用---
import * as req from 'network/request'

req.get({
    url: "/xxx"
}).then(res => {
    doSth...
}).catch(err => {
    doSth...
});
    
req.post({
    url: '/xxx',
    data: {
		key: value
    },
    headers: {
        //eg...
        'Authorization': myToken,
    }
}).then(res => {
    if (res.data.flag) {
        doSth...
    } else {
        doSth...
    }
}).catch(err => {
    doSth...
});
```

---
